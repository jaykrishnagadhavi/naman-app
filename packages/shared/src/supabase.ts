import { createClient, SupabaseClient, Session, AuthError } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

export const WEB_AUTH_STORAGE_KEY = 'sb-web-auth';
export const ADMIN_AUTH_STORAGE_KEY = 'sb-admin-auth';

export interface BrowserClientOptions {
  storageKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

// Global symbol for persisting client singletons across Vite HMR, multiple package resolutions, and re-renders
const SUPABASE_CLIENTS_GLOBAL_KEY = Symbol.for('__abrainoconscious_supabase_clients__');

type GlobalSupabaseStore = typeof globalThis & {
  [SUPABASE_CLIENTS_GLOBAL_KEY]?: Map<string, TypedSupabaseClient>;
};

function getClientStore(): Map<string, TypedSupabaseClient> {
  const g = globalThis as GlobalSupabaseStore;
  if (!g[SUPABASE_CLIENTS_GLOBAL_KEY]) {
    g[SUPABASE_CLIENTS_GLOBAL_KEY] = new Map<string, TypedSupabaseClient>();
  }
  return g[SUPABASE_CLIENTS_GLOBAL_KEY]!;
}

/**
 * Returns a cached module-level singleton Supabase browser client for the requested storage key.
 * Guaranteed to instantiate only once per storageKey across React Strict Mode, HMR, and duplicate imports.
 */
export function getBrowserClient(
  storageKey: string = WEB_AUTH_STORAGE_KEY,
  options?: BrowserClientOptions
): TypedSupabaseClient {
  const store = getClientStore();
  const effectiveKey = storageKey || options?.storageKey || WEB_AUTH_STORAGE_KEY;

  const existing = store.get(effectiveKey);
  if (existing) {
    return existing;
  }

  const url =
    options?.supabaseUrl ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL) ||
    'http://127.0.0.1:54321';

  const key =
    options?.supabaseAnonKey ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  const client = createClient<Database>(url, key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      // detectSessionInUrl is false to avoid GoTrue background auto-exchange races.
      // PKCE exchange is executed deterministically and safely by processOAuthCallback.
      detectSessionInUrl: false,
      storageKey: effectiveKey,
    },
  });

  store.set(effectiveKey, client);
  return client;
}

/**
 * Backwards-compatible alias for getBrowserClient.
 * Always returns the singleton instance for the requested storageKey.
 */
export function createBrowserClient(
  options?: BrowserClientOptions
): TypedSupabaseClient {
  return getBrowserClient(options?.storageKey || WEB_AUTH_STORAGE_KEY, options);
}

/**
 * Creates a privileged service-role Supabase client strictly for backend Edge Functions or secure API routes.
 */
export function createServerClient(
  supabaseUrl?: string,
  serviceRoleKey?: string
): TypedSupabaseClient {
  const url =
    supabaseUrl ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    'http://127.0.0.1:54321';

  const key =
    serviceRoleKey ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
    '';

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Testing utility to reset client singletons between test runs.
 */
export function resetBrowserClientsForTesting(): void {
  const store = getClientStore();
  store.clear();
}

// ============================================================================
// Single-Exchange OAuth / PKCE Callback Logic
// ============================================================================

export interface ParsedAuthCallbackParams {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorDescription: string | null;
  type: string | null;
}

/**
 * Extracts auth parameters from both search query and hash fragments.
 * Handles ?code=..., #access_token=..., #code=..., and error parameters.
 */
export function parseAuthCallbackParams(search?: string, hash?: string): ParsedAuthCallbackParams {
  const s = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const h = hash ?? (typeof window !== 'undefined' ? window.location.hash : '');

  const searchParams = new URLSearchParams(s.startsWith('?') ? s.slice(1) : s);
  const cleanHash = h.startsWith('#') ? h.slice(1) : h;
  const hashParams = new URLSearchParams(cleanHash);

  return {
    code: searchParams.get('code') || hashParams.get('code') || null,
    accessToken: searchParams.get('access_token') || hashParams.get('access_token') || null,
    refreshToken: searchParams.get('refresh_token') || hashParams.get('refresh_token') || null,
    error: searchParams.get('error') || hashParams.get('error') || null,
    errorDescription: searchParams.get('error_description') || hashParams.get('error_description') || null,
    type: searchParams.get('type') || hashParams.get('type') || null,
  };
}

// Module-level map of in-flight and completed exchange promises keyed by code.
// Guarantees that even across React Strict Mode double-mounts, only one network request is made.
const exchangePromises = new Map<string, Promise<{ session: Session | null; error: AuthError | Error | null }>>();

export interface ProcessOAuthCallbackOptions {
  supabase: TypedSupabaseClient;
  code?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  timeoutMs?: number;
  onStage?: (stage: string) => void;
}

export interface ProcessOAuthCallbackResult {
  success: boolean;
  session: Session | null;
  error: AuthError | Error | null;
  stages: string[];
}

/**
 * Deterministically processes an OAuth PKCE code or token callback with single-exchange enforcement,
 * session polling for up to timeoutMs (default 10s), and resilient recovery.
 */
export async function processOAuthCallback({
  supabase,
  code = null,
  accessToken = null,
  refreshToken = null,
  timeoutMs = 10000,
  onStage,
}: ProcessOAuthCallbackOptions): Promise<ProcessOAuthCallbackResult> {
  const stages: string[] = [];

  const recordStage = (stage: string) => {
    stages.push(stage);
    onStage?.(stage);
  };

  recordStage(`1_Init: code=${code ? 'present' : 'none'}, hash_tokens=${accessToken ? 'present' : 'none'}`);

  // CRITICAL: Synchronously register the in-flight exchange promise BEFORE any await
  // so that concurrent effects or React Strict Mode remounts immediately share the exact same promise.
  let inFlightPromise: Promise<{ session: Session | null; error: AuthError | Error | null }> | null = null;
  if (code) {
    inFlightPromise = exchangePromises.get(code) || null;
    if (!inFlightPromise) {
      recordStage('2_RegisterExchange: initiating single network promise');
      inFlightPromise = (async () => {
        try {
          const res = await supabase.auth.exchangeCodeForSession(code);
          if (res.error) {
            recordStage(`2_RegisterExchange: response warning=${res.error.message}`);
            // If the exchange failed (e.g. duplicate attempt where code was already consumed),
            // check if a valid session already exists in the client!
            const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session?.user) {
              recordStage('2_RegisterExchange: recovered active session despite exchange warning');
              return { session, error: null };
            }
            return { session: null, error: res.error };
          }
          recordStage('2_RegisterExchange: response success');
          return { session: res.data.session, error: null };
        } catch (err) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user) {
            recordStage('2_RegisterExchange: recovered active session despite exception');
            return { session, error: null };
          }
          const errorObj = err instanceof Error ? err : new Error(String(err));
          recordStage(`2_RegisterExchange: exception=${errorObj.message}`);
          return { session: null, error: errorObj };
        }
      })();
      exchangePromises.set(code, inFlightPromise);
    } else {
      recordStage('2_RegisterExchange: synchronously reusing existing in-flight exchange promise');
    }
  }

  // 1. If access_token and refresh_token were passed (e.g. from hash fragment), hydrate session
  if (accessToken && refreshToken) {
    recordStage('3_SetSessionFromTokens: started');
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        recordStage(`3_SetSessionFromTokens: warning=${error.message}`);
      } else if (data?.session) {
        recordStage('3_SetSessionFromTokens: success');
        return { success: true, session: data.session, error: null, stages };
      }
    } catch (err) {
      recordStage(`3_SetSessionFromTokens: exception=${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Await the shared exchange promise if an authorization code was provided
  let exchangeError: AuthError | Error | null = null;

  if (inFlightPromise) {
    try {
      const exchangeResult = await inFlightPromise;
      if (exchangeResult.error) {
        exchangeError = exchangeResult.error;
      }
      if (exchangeResult.session?.user) {
        recordStage('4_SessionConfirmed: from exchange result');
        return {
          success: true,
          session: exchangeResult.session,
          error: null,
          stages,
        };
      }
    } catch (err) {
      exchangeError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // 3. Resilient Session Polling:
  // Check getSession immediately, and poll every 300ms until timeoutMs expires
  recordStage('5_SessionPolling: started');
  const startTime = Date.now();
  const pollIntervalMs = 300;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session?.user) {
        recordStage(`5_SessionPolling: valid session found after ${Date.now() - startTime}ms`);
        return {
          success: true,
          session,
          error: null,
          stages,
        };
      }

      if (sessionError) {
        recordStage(`5_SessionPolling: getSession notice=${sessionError.message}`);
      }
    } catch (err) {
      recordStage(`5_SessionPolling: getSession exception=${err instanceof Error ? err.message : String(err)}`);
    }

    // Wait poll interval
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  // 4. Timeout reached without a valid session
  recordStage(`6_Timeout: exceeded ${timeoutMs}ms without active session`);
  const finalError = exchangeError || new Error(`Session verification timed out after ${Math.round(timeoutMs / 1000)} seconds.`);

  return {
    success: false,
    session: null,
    error: finalError,
    stages,
  };
}

/**
 * Cleans authorization code, tokens, and error parameters from window.location
 * without causing a page reload, preserving other query parameters.
 */
export function stripAuthParamsFromUrl(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) {
    return;
  }
  try {
    const url = new URL(window.location.href);
    let searchChanged = false;

    // Remove OAuth query parameters
    const queryParamsToRemove = ['code', 'error', 'error_description', 'error_code'];
    for (const param of queryParamsToRemove) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        searchChanged = true;
      }
    }

    // Remove hash fragment tokens if present
    let hashChanged = false;
    if (url.hash) {
      const cleanHash = url.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(cleanHash);
      const hashParamsToRemove = ['access_token', 'refresh_token', 'code', 'error', 'error_description', 'type'];
      for (const param of hashParamsToRemove) {
        if (hashParams.has(param)) {
          hashParams.delete(param);
          hashChanged = true;
        }
      }
      if (hashChanged) {
        const remaining = hashParams.toString();
        url.hash = remaining ? `#${remaining}` : '';
      }
    }

    if (searchChanged || hashChanged) {
      const cleanPath = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
      window.history.replaceState(null, '', cleanPath);
    }
  } catch {}
}

/**
 * Testing utility to reset OAuth callback tracking state.
 */
export function resetOAuthCallbackStateForTesting(): void {
  exchangePromises.clear();
}
