import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  AuthSplitLayout,
  GoogleButton,
  useAuth,
  TotpChallengeModal,
  Button
} from '@abrainoconscious/ui';
import {
  LoginSchema,
  MagicLinkSchema,
  mapAuthError,
  sanitizeRedirectPath,
  getAdminUrl,
  getAppUrl
} from '@abrainoconscious/shared';
import { Eye, EyeOff, AlertCircle, Mail, ShieldAlert, CheckCircle2, Clock, ArrowRight, LogOut } from 'lucide-react';

const THROTTLE_STORAGE_KEY = 'sb_admin_failed_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithPassword, signInWithGoogle, sendMagicLink, supabase, signOut } = useAuth();

  const nextParam = sanitizeRedirectPath(searchParams.get('next'), '/');
  const timeoutReason = searchParams.get('reason') === 'idle_timeout';

  const [mode, setMode] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Client-side throttling
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // MFA TOTP Challenge
  const [showTotpChallenge, setShowTotpChallenge] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(THROTTLE_STORAGE_KEY);
      if (stored) {
        const count = parseInt(stored, 10);
        if (!isNaN(count)) setFailedAttempts(count);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const recordFailedAttempt = () => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    try {
      sessionStorage.setItem(THROTTLE_STORAGE_KEY, nextCount.toString());
    } catch {}

    if (nextCount >= MAX_FAILED_ATTEMPTS) {
      setCooldownRemaining(COOLDOWN_SECONDS);
    }
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    try {
      sessionStorage.removeItem(THROTTLE_STORAGE_KEY);
    } catch {}
  };

  const checkAalAndProceed = async () => {
    resetFailedAttempts();
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!error && data) {
        if (data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
          // TOTP is enrolled on this account: challenge the user
          setShowTotpChallenge(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Error evaluating authenticator assurance level:', err);
    }

    navigate(nextParam, { replace: true });
  };

  const handleGoogleLogin = async () => {
    if (cooldownRemaining > 0) return;
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      const callbackUrl = `${getAdminUrl('/auth/callback')}${
        nextParam && nextParam !== '/' ? `?next=${encodeURIComponent(nextParam)}` : ''
      }`;

      const { error } = await signInWithGoogle({ redirectTo: callbackUrl });
      if (error) {
        recordFailedAttempt();
        setErrorMessage(mapAuthError(error));
        setGoogleLoading(false);
      }
    } catch (err) {
      recordFailedAttempt();
      setErrorMessage(mapAuthError(err as Error));
      setGoogleLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;

    setErrorMessage(null);

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please check your inputs.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) {
        recordFailedAttempt();
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      // Check role directly per Spec Section 4 / Requirement 13
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (!profileData || !['admin', 'staff'].includes(profileData.role)) {
          await signOut();
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      await checkAalAndProceed();
    } catch (err) {
      recordFailedAttempt();
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;

    setErrorMessage(null);

    const validation = MagicLinkSchema.safeParse({ email });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please enter a valid email.');
      return;
    }

    setLoading(true);
    try {
      const emailRedirectTo = `${getAdminUrl('/auth/callback')}${
        nextParam && nextParam !== '/' ? `?next=${encodeURIComponent(nextParam)}` : ''
      }`;

      const { error } = await sendMagicLink(email.trim(), { emailRedirectTo });
      if (error) {
        recordFailedAttempt();
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setLoading(false);
    } catch (err) {
      recordFailedAttempt();
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
        <div className="max-w-md space-y-6 rounded-2xl border border-red-500/30 bg-[#081619] p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-white">Access Denied</h2>
            <p className="text-xs text-[#8D9FA4] leading-relaxed">
              This portal is restricted exclusively to ABrainoConscious administrators and staff.
              Your account does not possess administrative privileges.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                window.location.href = getAppUrl();
              }}
            >
              <span>Return to Student App</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-xs"
              onClick={() => {
                setAccessDenied(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign In with Different Account</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthSplitLayout
        title="Naman Studio"
        subtitle="Administrative console for cohort management, daily live links, and platform operations."
        badgeText="Staff & Creator Portal"
        photoSrc="/img/naman/naman-header-960.webp"
        quote="“Lead with responsibility. Guard student trust with absolute precision.”"
        quoteAuthor="Naman — ABrainoConscious"
      >
        <div className="space-y-6">
          {timeoutReason && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2 animate-in fade-in">
              <Clock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <span>Your session locked after 30 minutes of inactivity. Please sign in to resume.</span>
            </div>
          )}

          {cooldownRemaining > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Login Attempts Temporarily Throttled</span>
              </div>
              <p>
                Too many failed attempts. For security, please wait{' '}
                <strong className="text-white">{cooldownRemaining}s</strong> before trying again.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <GoogleButton
            onClick={handleGoogleLogin}
            loading={googleLoading}
            disabled={cooldownRemaining > 0}
            label="Continue with Google"
          />

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#1A373E]" />
            <span className="absolute bg-[#081619] px-3 text-[11px] uppercase tracking-wider text-[#556B71]">
              or administrative email
            </span>
          </div>

          {magicLinkSent ? (
            <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center animate-in fade-in">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Admin Sign-In Link Sent</h3>
                <p className="text-xs text-[#8D9FA4]">
                  A magic authentication link was dispatched to <strong className="text-white">{email}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMagicLinkSent(false);
                  setMode('password');
                }}
                className="text-xs text-amber-400 hover:underline pt-2 inline-block"
              >
                Use Password Instead
              </button>
            </div>
          ) : mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white">Administrator Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@abrainoconcious.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={cooldownRemaining > 0}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-white">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#8D9FA4] hover:text-white flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={cooldownRemaining > 0}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode('magic-link')}
                  className="text-[#8D9FA4] hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email me a sign-in link</span>
                </button>
                <Link to="/forgot-password" className="text-amber-400 hover:text-amber-300 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || cooldownRemaining > 0}
                  className="w-full font-bold"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Studio'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white">Administrator Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@abrainoconcious.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={cooldownRemaining > 0}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className="text-[#8D9FA4] hover:text-white"
                >
                  &larr; Use password instead
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || cooldownRemaining > 0}
                  className="w-full font-bold"
                >
                  {loading ? 'Dispatching Link...' : 'Send Magic Sign-In Link'}
                </Button>
              </div>
            </form>
          )}

          <div className="text-center pt-2 text-[11px] text-[#556B71]">
            ABrainoConscious Management Dashboard • Staff & Admin Access Only
          </div>
        </div>
      </AuthSplitLayout>

      {/* TOTP 2FA Verification Modal */}
      <TotpChallengeModal
        show={showTotpChallenge}
        onSuccess={() => {
          setShowTotpChallenge(false);
          navigate(nextParam, { replace: true });
        }}
        onCancel={() => {
          setShowTotpChallenge(false);
          signOut().catch(console.warn);
        }}
      />
    </>
  );
};
