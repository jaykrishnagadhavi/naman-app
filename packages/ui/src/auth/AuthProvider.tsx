import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import {
  getBrowserClient,
  type TypedSupabaseClient,
  type Profile,
  type UserRole,
  WEB_AUTH_STORAGE_KEY
} from '@abrainoconscious/shared';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  supabase: TypedSupabaseClient;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    options?: {
      fullName?: string;
      phone?: string;
      emailRedirectTo?: string;
    }
  ) => Promise<{ error: AuthError | null; user: User | null }>;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{ error: AuthError | null }>;
  sendMagicLink: (email: string, options?: { emailRedirectTo?: string }) => Promise<{ error: AuthError | null }>;
  sendPasswordReset: (email: string, options?: { redirectTo?: string }) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  resendVerification: (email: string, options?: { emailRedirectTo?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signOutEverywhere: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<Profile | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  supabaseClient?: TypedSupabaseClient;
  storageKey?: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  supabaseClient,
  storageKey = WEB_AUTH_STORAGE_KEY,
}) => {
  // Use the module-level singleton browser client. Never reinstantiate inside render or effects.
  const supabase = supabaseClient ?? getBrowserClient(storageKey);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Active user ID tracked separately to decouple profile fetches from onAuthStateChange
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Helper to fetch profile from profiles table with 3s timeout safety
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('Profile fetch timeout after 3s') }), 3000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) {
          console.warn('Could not fetch user profile:', error.message);
          return null;
        }
        return data as Profile | null;
      } catch (err) {
        console.warn('Error fetching user profile:', err);
        return null;
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    let targetId = user?.id;
    if (!targetId) {
      const { data: { session: curSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      targetId = curSession?.user?.id;
    }
    if (!targetId) {
      setProfile(null);
      return null;
    }
    const fresh = await fetchProfile(targetId);
    setProfile(fresh);
    return fresh;
  }, [user, supabase, fetchProfile]);

  // 1. Initial session load with 5s safety timeout and synchronous onAuthStateChange listener
  useEffect(() => {
    let isMounted = true;
    let sessionResolved = false;

    // Safety timeout: Ensure loading state is never indefinitely stuck
    const safetyTimeout = setTimeout(() => {
      if (!sessionResolved && isMounted) {
        console.warn('Initial session fetch exceeded 5s; unblocking loading state.');
        setLoading(false);
      }
    }, 5000);

    // Fetch initial session
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        sessionResolved = true;
        clearTimeout(safetyTimeout);
        if (!isMounted) return;
        if (error) {
          console.warn('Initial session fetch notice:', error.message);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setActiveUserId(initialSession?.user?.id ?? null);
        setLoading(false);
      })
      .catch((err) => {
        sessionResolved = true;
        clearTimeout(safetyTimeout);
        if (!isMounted) return;
        console.warn('Unexpected error in getSession:', err);
        setInitError(err instanceof Error ? err.message : 'Could not initialize session.');
        setLoading(false);
      });

    // Auth state listener: strictly synchronous callback, NEVER awaiting Supabase calls inside
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setActiveUserId(currentSession?.user?.id ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 2. Decoupled profile fetcher: runs asynchronously when activeUserId changes
  useEffect(() => {
    let isCancelled = false;

    if (!activeUserId) {
      setProfile(null);
      return;
    }

    // Defer profile fetch to next tick so GoTrue has completely settled its auth state
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUserId)
          .maybeSingle();

        if (isCancelled) return;
        if (error) {
          console.warn('Could not fetch user profile:', error.message);
          return;
        }
        setProfile((data as Profile) || null);
      } catch (err) {
        if (isCancelled) return;
        console.warn('Error fetching user profile:', err);
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeUserId, supabase]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        setActiveUserId(data.user.id);
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      }
      return { error };
    },
    [supabase, fetchProfile]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: {
        fullName?: string;
        phone?: string;
        emailRedirectTo?: string;
      }
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options?.fullName,
            phone: options?.phone,
          },
          emailRedirectTo: options?.emailRedirectTo,
        },
      });
      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        setActiveUserId(data.user.id);
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      }
      return { error, user: data.user };
    },
    [supabase, fetchProfile]
  );

  const signInWithGoogle = useCallback(
    async (options?: { redirectTo?: string }) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options?.redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    },
    [supabase]
  );

  const sendMagicLink = useCallback(
    async (email: string, options?: { emailRedirectTo?: string }) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: options?.emailRedirectTo,
        },
      });
      return { error };
    },
    [supabase]
  );

  const sendPasswordReset = useCallback(
    async (email: string, options?: { redirectTo?: string }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: options?.redirectTo,
      });
      return { error };
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    },
    [supabase]
  );

  const resendVerification = useCallback(
    async (email: string, options?: { emailRedirectTo?: string }) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: options?.emailRedirectTo,
        },
      });
      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setActiveUserId(null);
    setProfile(null);
    return { error };
  }, [supabase]);

  const signOutEverywhere = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    setSession(null);
    setUser(null);
    setActiveUserId(null);
    setProfile(null);
    return { error };
  }, [supabase]);

  const handleRetrySession = () => {
    setInitError(null);
    setLoading(true);
    supabase.auth
      .getSession()
      .then(({ data: { session: retrySession } }) => {
        setSession(retrySession);
        setUser(retrySession?.user ?? null);
        setActiveUserId(retrySession?.user?.id ?? null);
        setLoading(false);
      })
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : 'Could not reconnect session.');
        setLoading(false);
      });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      supabase,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      sendMagicLink,
      sendPasswordReset,
      updatePassword,
      resendVerification,
      signOut,
      signOutEverywhere,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      supabase,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      sendMagicLink,
      sendPasswordReset,
      updatePassword,
      resendVerification,
      signOut,
      signOutEverywhere,
      refreshProfile,
    ]
  );

  // Friendly non-crashing fallback screen when a fatal initialization error occurs
  if (initError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
        <div className="max-w-md space-y-4 rounded-2xl border border-amber-500/30 bg-[#081619] p-8 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-white">Connection Notice</h2>
            <p className="text-xs text-[#8D9FA4] leading-relaxed">
              We encountered a temporary connection notice while loading your learning session.
            </p>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-400 flex items-center justify-center gap-2 transition-colors"
              onClick={handleRetrySession}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-[#1A373E] bg-[#040C0E] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#0E2024] transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
