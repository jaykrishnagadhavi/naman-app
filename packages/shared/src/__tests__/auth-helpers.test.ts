import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sanitizeRedirectPath,
  sanitizeProgramSlug,
  resolvePostAuthPath,
  getAppUrl,
  getAdminUrl,
  getLandingUrl,
  getRootDomain,
  mapAuthError,
  SignupSchema,
  LoginSchema,
  ResetPasswordSchema,
  OnboardingSchema,
  getBrowserClient,
  createBrowserClient,
  resetBrowserClientsForTesting,
  parseAuthCallbackParams,
  processOAuthCallback,
  resetOAuthCallbackStateForTesting,
  stripAuthParamsFromUrl,
  WEB_AUTH_STORAGE_KEY,
  ADMIN_AUTH_STORAGE_KEY,
  type TypedSupabaseClient,
} from '../index';

describe('Safe Redirect Helpers', () => {
  describe('sanitizeRedirectPath', () => {
    it('accepts safe relative paths', () => {
      expect(sanitizeRedirectPath('/my-programs')).toBe('/my-programs');
      expect(sanitizeRedirectPath('/programs/21-day-mindset/learn')).toBe('/programs/21-day-mindset/learn');
      expect(sanitizeRedirectPath('/my-programs?view=grid&sort=asc')).toBe('/my-programs?view=grid&sort=asc');
      expect(sanitizeRedirectPath('/courses/123#lesson-4')).toBe('/courses/123#lesson-4');
    });

    it('rejects open redirects and external URLs', () => {
      expect(sanitizeRedirectPath('https://evil.com')).toBe('/');
      expect(sanitizeRedirectPath('http://attacker.com/steal')).toBe('/');
      expect(sanitizeRedirectPath('ftp://files.example.com')).toBe('/');
    });

    it('rejects protocol-relative exploits (//evil.com)', () => {
      expect(sanitizeRedirectPath('//evil.com')).toBe('/');
      expect(sanitizeRedirectPath('///evil.com')).toBe('/');
      expect(sanitizeRedirectPath('//attacker.com/phishing')).toBe('/');
    });

    it('rejects Windows / backslash evasion (\\evil.com, /\\evil.com, /foo\\bar)', () => {
      expect(sanitizeRedirectPath('\\evil.com')).toBe('/');
      expect(sanitizeRedirectPath('/\\evil.com')).toBe('/');
      expect(sanitizeRedirectPath('/path\\traversal')).toBe('/');
      expect(sanitizeRedirectPath('\\\\remote-server\\share')).toBe('/');
    });

    it('rejects pseudo-protocols (javascript:, data:, vbscript:)', () => {
      expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirectPath('javascript:window.location="http://evil.com"')).toBe('/');
      expect(sanitizeRedirectPath('/javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/');
      expect(sanitizeRedirectPath('vbscript:msgbox(1)')).toBe('/');
      expect(sanitizeRedirectPath('JAVAscript:alert(1)')).toBe('/');
    });

    it('handles empty, null, and non-string inputs safely', () => {
      expect(sanitizeRedirectPath('')).toBe('/');
      expect(sanitizeRedirectPath(null)).toBe('/');
      expect(sanitizeRedirectPath(undefined)).toBe('/');
      expect(sanitizeRedirectPath('   ')).toBe('/');
      expect(sanitizeRedirectPath(null, '/default-fallback')).toBe('/default-fallback');
    });
  });

  describe('sanitizeProgramSlug', () => {
    it('accepts clean program slugs', () => {
      expect(sanitizeProgramSlug('21-day-mindset')).toBe('21-day-mindset');
      expect(sanitizeProgramSlug('emotional-resilience-101')).toBe('emotional-resilience-101');
      expect(sanitizeProgramSlug('COURSES_2026')).toBe('courses_2026');
    });

    it('rejects hostile slugs with paths, queries, or scripts', () => {
      expect(sanitizeProgramSlug('//evil.com')).toBe('');
      expect(sanitizeProgramSlug('../secret')).toBe('');
      expect(sanitizeProgramSlug('slug?query=1')).toBe('');
      expect(sanitizeProgramSlug('slug<script>')).toBe('');
      expect(sanitizeProgramSlug(null)).toBe('');
    });
  });

  describe('resolvePostAuthPath', () => {
    it('prioritizes valid program slug into /programs/:slug', () => {
      expect(
        resolvePostAuthPath({
          program: '21-day-mindset',
          next: '/my-programs',
        })
      ).toBe('/programs/21-day-mindset');
    });

    it('falls back to sanitized next path when program is omitted', () => {
      expect(
        resolvePostAuthPath({
          next: '/explore?cat=mental',
        })
      ).toBe('/explore?cat=mental');
    });

    it('falls back to default when next is hostile and program is omitted', () => {
      expect(
        resolvePostAuthPath({
          next: 'https://evil.com',
          fallback: '/my-programs',
        })
      ).toBe('/my-programs');
    });
  });
});

describe('URL Helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('respects VITE_ROOT_DOMAIN dynamically without hardcoding', () => {
    process.env.VITE_ROOT_DOMAIN = 'custom-domain.org';
    expect(getRootDomain()).toBe('custom-domain.org');
  });

  it('generates development URLs correctly for local ports', () => {
    process.env.NODE_ENV = 'development';
    expect(getAppUrl()).toBe('http://localhost:5173');
    expect(getAppUrl('/login')).toBe('http://localhost:5173/login');
    expect(getAdminUrl()).toBe('http://localhost:5174');
    expect(getAdminUrl('/programs')).toBe('http://localhost:5174/programs');
    expect(getLandingUrl()).toBe('http://localhost:5175');
    expect(getLandingUrl('/#faq')).toBe('http://localhost:5175/#faq');
  });

  it('generates production URLs correctly with subdomains', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITE_ROOT_DOMAIN = 'abrainoconcious.com';
    expect(getAppUrl('/my-programs')).toBe('https://app.abrainoconcious.com/my-programs');
    expect(getAdminUrl('/overview')).toBe('https://admin.abrainoconcious.com/overview');
    expect(getLandingUrl()).toBe('https://abrainoconcious.com');
  });
});

describe('Friendly Auth Error Mapper', () => {
  it('maps wrong password / invalid credentials warmly', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toContain("We couldn't sign you in with those details");
    expect(mapAuthError(new Error('Invalid login credentials'))).toContain("We couldn't sign you in with those details");
  });

  it('maps unverified email kindly', () => {
    expect(mapAuthError({ code: 'email_not_confirmed' })).toContain("Your email hasn't been verified yet");
  });

  it('maps already registered accounts clearly', () => {
    expect(mapAuthError({ code: 'user_already_exists' })).toContain("An account with this email already exists");
  });

  it('maps rate limits with a calm breathing pause', () => {
    expect(mapAuthError({ code: 'over_request_rate_limit' })).toContain('Take a calm breather');
    expect(mapAuthError('rate limit exceeded')).toContain('Take a calm breather');
  });

  it('maps expired OTP / recovery tokens', () => {
    expect(mapAuthError({ code: 'otp_expired' })).toContain('That sign-in link has expired');
    expect(mapAuthError('Token has expired or is invalid')).toContain('That sign-in link has expired');
  });

  it('provides a calm default fallback for unexpected errors', () => {
    expect(mapAuthError(new Error('Postgres connection failed: socket error'))).toContain('Something unexpected happened on our side');
  });
});

describe('Zod Validation Schemas', () => {
  it('validates signup input correctly', () => {
    const valid = SignupSchema.safeParse({
      fullName: 'Aarav Patel',
      email: 'aarav@example.com',
      password: 'StrongPassword123!',
      termsAccepted: true,
    });
    expect(valid.success).toBe(true);

    const missingTerms = SignupSchema.safeParse({
      fullName: 'Aarav Patel',
      email: 'aarav@example.com',
      password: 'StrongPassword123!',
      termsAccepted: false,
    });
    expect(missingTerms.success).toBe(false);

    const weakPassword = SignupSchema.safeParse({
      fullName: 'Aarav Patel',
      email: 'aarav@example.com',
      password: 'short',
      termsAccepted: true,
    });
    expect(weakPassword.success).toBe(false);
  });

  it('validates login input correctly', () => {
    expect(LoginSchema.safeParse({ email: 'aarav@example.com', password: 'pass' }).success).toBe(true);
    expect(LoginSchema.safeParse({ email: 'bad-email', password: 'pass' }).success).toBe(false);
  });

  it('validates password reset match', () => {
    expect(
      ResetPasswordSchema.safeParse({
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }).success
    ).toBe(true);

    expect(
      ResetPasswordSchema.safeParse({
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }).success
    ).toBe(false);
  });

  it('validates onboarding input with Indian mobile number', () => {
    const valid = OnboardingSchema.safeParse({
      fullName: 'Rohan Sharma',
      phone: '+91 9876543210',
      goalPillars: ['emotional', 'mental'],
      referralSource: 'youtube',
    });
    expect(valid.success).toBe(true);

    const validBare10Digit = OnboardingSchema.safeParse({
      fullName: 'Rohan Sharma',
      phone: '9876543210',
      goalPillars: ['academic'],
      referralSource: 'instagram',
    });
    expect(validBare10Digit.success).toBe(true);

    const invalidPhone = OnboardingSchema.safeParse({
      fullName: 'Rohan Sharma',
      phone: '12345',
      goalPillars: ['personal'],
      referralSource: 'friend',
    });
    expect(invalidPhone.success).toBe(false);

    const emptyPillars = OnboardingSchema.safeParse({
      fullName: 'Rohan Sharma',
      phone: '9876543210',
      goalPillars: [],
      referralSource: 'other',
    });
    expect(emptyPillars.success).toBe(false);
  });
});

describe('Supabase Browser Client Module-Level Singleton', () => {
  beforeEach(() => {
    resetBrowserClientsForTesting();
  });

  afterEach(() => {
    resetBrowserClientsForTesting();
  });

  it('guarantees only one client instance exists per storage key', () => {
    const webClient1 = getBrowserClient(WEB_AUTH_STORAGE_KEY);
    const webClient2 = getBrowserClient(WEB_AUTH_STORAGE_KEY);
    const webClient3 = createBrowserClient({ storageKey: WEB_AUTH_STORAGE_KEY });

    // Must be the exact same object reference
    expect(webClient1).toBe(webClient2);
    expect(webClient2).toBe(webClient3);

    // Admin storage key gets its own isolated singleton
    const adminClient1 = getBrowserClient(ADMIN_AUTH_STORAGE_KEY);
    const adminClient2 = getBrowserClient(ADMIN_AUTH_STORAGE_KEY);

    expect(adminClient1).toBe(adminClient2);
    expect(adminClient1).not.toBe(webClient1);
  });
});

describe('OAuth PKCE Callback URL Parsing, Single-Exchange & Resilience', () => {
  beforeEach(() => {
    resetOAuthCallbackStateForTesting();
  });

  afterEach(() => {
    resetOAuthCallbackStateForTesting();
  });

  describe('parseAuthCallbackParams', () => {
    it('parses authorization code from search query', () => {
      const parsed = parseAuthCallbackParams('?code=query-code-123&program=mindset', '');
      expect(parsed.code).toBe('query-code-123');
      expect(parsed.error).toBeNull();
    });

    it('parses authorization code from hash fragment', () => {
      const parsed = parseAuthCallbackParams('', '#code=hash-code-456');
      expect(parsed.code).toBe('hash-code-456');
    });

    it('parses access_token and refresh_token from hash fragment', () => {
      const parsed = parseAuthCallbackParams('', '#access_token=actok&refresh_token=reftok&token_type=bearer');
      expect(parsed.accessToken).toBe('actok');
      expect(parsed.refreshToken).toBe('reftok');
    });

    it('parses error parameters from query and hash', () => {
      const parsed = parseAuthCallbackParams('?error=access_denied&error_description=User+denied', '');
      expect(parsed.error).toBe('access_denied');
      expect(parsed.errorDescription).toBe('User denied');
    });
  });

  // 1. Callback with a code
  it('1. Callback with a code: exchanges code and returns active session', async () => {
    let exchangeCalled = false;
    const mockSession = {
      user: { id: 'student-uuid-1', email: 'student1@example.com' },
      access_token: 'valid-token',
    };

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: async (code: string) => {
          expect(code).toBe('valid-auth-code');
          exchangeCalled = true;
          return { data: { session: mockSession }, error: null };
        },
        getSession: async () => {
          return { data: { session: mockSession }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    const result = await processOAuthCallback({
      supabase: mockSupabase,
      code: 'valid-auth-code',
      timeoutMs: 1000,
    });

    expect(exchangeCalled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.session?.user?.id).toBe('student-uuid-1');
    expect(result.error).toBeNull();
  });

  // 2. Callback with an existing session
  it('2. Callback with an existing session: succeeds immediately without code exchange', async () => {
    let exchangeCalled = false;
    const mockSession = {
      user: { id: 'existing-student-uuid', email: 'existing@example.com' },
    };

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: async () => {
          exchangeCalled = true;
          return { data: { session: null }, error: new Error('Should not be called') };
        },
        getSession: async () => {
          return { data: { session: mockSession }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    const result = await processOAuthCallback({
      supabase: mockSupabase,
      code: null, // No code in URL
      timeoutMs: 1000,
    });

    expect(exchangeCalled).toBe(false);
    expect(result.success).toBe(true);
    expect(result.session?.user?.id).toBe('existing-student-uuid');
    expect(result.error).toBeNull();
  });

  // 3. Callback where exchange errors but session exists
  it('3. Callback where exchange errors but a session exists: resiliently treats as success', async () => {
    const mockSession = {
      user: { id: 'pre-existing-user', email: 'user@example.com' },
    };

    const mockSupabase = {
      auth: {
        // Exchange fails (e.g. 404 / code already consumed)
        exchangeCodeForSession: async () => {
          return {
            data: null,
            error: {
              name: 'AuthApiError',
              message: 'PKCE grant failed: code has already been consumed',
              status: 404,
            },
          };
        },
        // BUT getSession already has the active session stored
        getSession: async () => {
          return { data: { session: mockSession }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    const result = await processOAuthCallback({
      supabase: mockSupabase,
      code: 'already-used-code',
      timeoutMs: 1000,
    });

    expect(result.success).toBe(true);
    expect(result.session?.user?.id).toBe('pre-existing-user');
    expect(result.error).toBeNull();
  });

  // 4. Strict Mode double mount
  it('4. Strict Mode double mount: executes code exchange exactly once and resolves both mounts', async () => {
    let exchangeCount = 0;
    const mockSession = {
      user: { id: 'strict-mode-user', email: 'strict@example.com' },
      access_token: 'fake-access-token',
    };

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: async (_code: string) => {
          exchangeCount++;
          // Simulate network roundtrip latency
          await new Promise((r) => setTimeout(r, 20));
          return { data: { session: mockSession }, error: null };
        },
        getSession: async () => {
          return { data: { session: mockSession }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    const code = 'strict-mode-single-use-code';

    // Simulate React Strict Mode mounting twice concurrently/sequentially
    const [result1, result2] = await Promise.all([
      processOAuthCallback({ supabase: mockSupabase, code, timeoutMs: 1000 }),
      processOAuthCallback({ supabase: mockSupabase, code, timeoutMs: 1000 }),
    ]);

    // exchangeCodeForSession must have been called EXACTLY ONCE
    expect(exchangeCount).toBe(1);

    // Both invocations should resolve successfully to the session
    expect(result1.success).toBe(true);
    expect(result1.session?.user?.id).toBe('strict-mode-user');
    expect(result2.success).toBe(true);
    expect(result2.session?.user?.id).toBe('strict-mode-user');
  });

  // 5. Timeout fallback
  it('5. Timeout fallback: cleanly fails after timeoutMs when no session ever materializes', async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: async () => {
          return {
            data: null,
            error: {
              name: 'AuthApiError',
              message: 'Invalid authorization code',
              status: 400,
            },
          };
        },
        getSession: async () => {
          return { data: { session: null }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    const result = await processOAuthCallback({
      supabase: mockSupabase,
      code: 'unusable-code',
      timeoutMs: 400, // Short timeout for test speed
    });

    expect(result.success).toBe(false);
    expect(result.session).toBeNull();
    expect(result.error).not.toBeNull();
  });
});

describe('Strict Mode Double Mount Callback Lifecycle Simulation', () => {
  beforeEach(() => {
    resetOAuthCallbackStateForTesting();
  });

  it('asserts: no error UI is ever rendered, one exchange occurs, and one navigation happens', async () => {
    let exchangeCount = 0;
    const mockSession = {
      user: { id: 'student-uuid-strict-mode', email: 'test@example.com' },
      access_token: 'valid-token',
    };

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: async (_code: string) => {
          exchangeCount++;
          // Simulate network roundtrip latency
          await new Promise((r) => setTimeout(r, 30));
          return { data: { session: mockSession }, error: null };
        },
        getSession: async () => {
          return { data: { session: mockSession }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    // Simulate the exact component state tracking
    const renderedUIStates: ('loading' | 'error')[] = ['loading']; // Component initially renders loading
    const navigations: { target: string; replace: boolean }[] = [];
    const hasNavigatedRef = { current: false };

    // Function modeling the effect logic in AuthCallbackPage / AdminAuthCallbackPage
    const createMountRunner = () => {
      let isCancelled = false;

      const performNavigation = (target: string) => {
        if (isCancelled || hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;
        navigations.push({ target, replace: true });
      };

      const runCallback = async (code: string) => {
        try {
          const result = await processOAuthCallback({
            supabase: mockSupabase,
            code,
            timeoutMs: 1000,
          });

          if (isCancelled) return;

          let session = result.session;
          if (!session?.user) {
            const { data: { session: checkSession } } = await mockSupabase.auth.getSession();
            session = checkSession;
          }

          if (isCancelled) return;

          if (session?.user) {
            performNavigation('/my-programs');
            return;
          }

          // Final check before ever setting error UI
          const { data: { session: finalCheck } } = await mockSupabase.auth.getSession();
          if (finalCheck?.user) {
            performNavigation('/my-programs');
            return;
          }

          if (!isCancelled) {
            renderedUIStates.push('error');
          }
        } catch {
          if (isCancelled) return;

          const { data: { session: recoverySession } } = await mockSupabase.auth.getSession();
          if (recoverySession?.user) {
            performNavigation('/my-programs');
            return;
          }

          if (!isCancelled) {
            renderedUIStates.push('error');
          }
        }
      };

      const cleanup = () => {
        isCancelled = true;
      };

      return { runCallback, cleanup };
    };

    const code = 'strict-mode-auth-code-123';

    // 1. Mount 1 runs
    const mount1 = createMountRunner();
    const mount1Promise = mount1.runCallback(code);

    // 2. React Strict Mode immediately triggers cleanup on Mount 1
    mount1.cleanup();

    // 3. Mount 2 runs on the same instance
    const mount2 = createMountRunner();
    const mount2Promise = mount2.runCallback(code);

    // Both promises settle
    await Promise.all([mount1Promise, mount2Promise]);

    // Assert: no error UI is ever rendered (only loading states recorded)
    const errorRenders = renderedUIStates.filter((s) => s === 'error');
    expect(errorRenders).toHaveLength(0);

    // Assert: one exchange occurs
    expect(exchangeCount).toBe(1);

    // Assert: one navigation happens
    expect(navigations).toHaveLength(1);
    expect(navigations[0]).toEqual({ target: '/my-programs', replace: true });
  });

  it('asserts: when duplicate attempt reports error but session exists, no error UI is rendered, one exchange occurs, and one navigation happens', async () => {
    let exchangeCount = 0;
    const mockSession = {
      user: { id: 'student-uuid-456', email: 'test2@example.com' },
      access_token: 'token-456',
    };

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: async () => {
          exchangeCount++;
          // First call consumes verifier, subsequent calls report error
          if (exchangeCount > 1) {
            return {
              data: null,
              error: { name: 'AuthApiError', message: 'PKCE code verifier not found or code already consumed', status: 400 },
            };
          }
          await new Promise((r) => setTimeout(r, 20));
          return { data: { session: mockSession }, error: null };
        },
        getSession: async () => {
          return { data: { session: mockSession }, error: null };
        },
      },
    } as unknown as TypedSupabaseClient;

    const renderedUIStates: ('loading' | 'error')[] = ['loading'];
    const navigations: { target: string; replace: boolean }[] = [];
    const hasNavigatedRef = { current: false };

    const createMountRunner = () => {
      let isCancelled = false;

      const performNavigation = (target: string) => {
        if (isCancelled || hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;
        navigations.push({ target, replace: true });
      };

      const runCallback = async (code: string) => {
        try {
          const result = await processOAuthCallback({
            supabase: mockSupabase,
            code,
            timeoutMs: 1000,
          });

          if (isCancelled) return;

          let session = result.session;
          if (!session?.user) {
            const { data: { session: checkSession } } = await mockSupabase.auth.getSession();
            session = checkSession;
          }

          if (isCancelled) return;

          if (session?.user) {
            performNavigation('/my-programs');
            return;
          }

          const { data: { session: finalCheck } } = await mockSupabase.auth.getSession();
          if (finalCheck?.user) {
            performNavigation('/my-programs');
            return;
          }

          if (!isCancelled) {
            renderedUIStates.push('error');
          }
        } catch {
          if (isCancelled) return;
          const { data: { session: recoverySession } } = await mockSupabase.auth.getSession();
          if (recoverySession?.user) {
            performNavigation('/my-programs');
            return;
          }
          if (!isCancelled) {
            renderedUIStates.push('error');
          }
        }
      };

      const cleanup = () => {
        isCancelled = true;
      };

      return { runCallback, cleanup };
    };

    const code = 'duplicate-test-code';
    const mount1 = createMountRunner();
    const mount1Promise = mount1.runCallback(code);
    mount1.cleanup();

    const mount2 = createMountRunner();
    const mount2Promise = mount2.runCallback(code);

    await Promise.all([mount1Promise, mount2Promise]);

    // Assert: no error UI is ever rendered
    expect(renderedUIStates.filter((s) => s === 'error')).toHaveLength(0);

    // Assert: one exchange occurs
    expect(exchangeCount).toBe(1);

    // Assert: one navigation happens
    expect(navigations).toHaveLength(1);
    expect(navigations[0]).toEqual({ target: '/my-programs', replace: true });
  });

  it('stripAuthParamsFromUrl strips code, tokens, and errors from browser URL', () => {
    let replacedUrl: string | null = null;
    const originalWindow = globalThis.window;

    // Mock window and history
    const mockWindow = {
      location: {
        href: 'https://app.abrainoconscious.com/auth/callback?code=test-code-abc&state=xyz#access_token=token123&refresh_token=refresh123',
        pathname: '/auth/callback',
        search: '?code=test-code-abc&state=xyz',
        hash: '#access_token=token123&refresh_token=refresh123',
      },
      history: {
        replaceState: (_data: unknown, _unused: string, url: string) => {
          replacedUrl = url;
        },
      },
    };

    // @ts-expect-error Mocking window for testing
    globalThis.window = mockWindow;

    try {
      stripAuthParamsFromUrl();
      expect(replacedUrl).not.toBeNull();
      expect(replacedUrl).not.toContain('code=');
      expect(replacedUrl).not.toContain('access_token=');
      expect(replacedUrl).not.toContain('refresh_token=');
      expect(replacedUrl).toContain('state=xyz');
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

