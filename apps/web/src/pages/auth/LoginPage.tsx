import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  AuthSplitLayout,
  GoogleButton,
  useAuth,
  Button
} from '@abrainoconscious/ui';
import {
  LoginSchema,
  MagicLinkSchema,
  mapAuthError,
  sanitizeRedirectPath,
  sanitizeProgramSlug,
  getAppUrl
} from '@abrainoconscious/shared';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithPassword, signInWithGoogle, sendMagicLink } = useAuth();

  const nextParam = sanitizeRedirectPath(searchParams.get('next'), '/');
  const programParam = sanitizeProgramSlug(searchParams.get('program'));

  const [mode, setMode] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (programParam) queryParams.set('program', programParam);
      if (nextParam && nextParam !== '/') queryParams.set('next', nextParam);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const callbackUrl = `${getAppUrl('/auth/callback')}${qs}`;

      const { error } = await signInWithGoogle({ redirectTo: callbackUrl });
      if (error) {
        setErrorMessage(mapAuthError(error));
        setGoogleLoading(false);
      }
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setGoogleLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      // If program slug is present, land on that program's page
      if (programParam) {
        navigate(`/programs/${programParam}`, { replace: true });
        return;
      }

      navigate(nextParam, { replace: true });
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = MagicLinkSchema.safeParse({ email });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please enter a valid email.');
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (programParam) queryParams.set('program', programParam);
      if (nextParam && nextParam !== '/') queryParams.set('next', nextParam);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const emailRedirectTo = `${getAppUrl('/auth/callback')}${qs}`;

      const { error } = await sendMagicLink(email.trim(), { emailRedirectTo });
      if (error) {
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      setMagicLinkSent(true);
      setLoading(false);
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  const signupLink = `/signup${
    programParam ? `?program=${encodeURIComponent(programParam)}` : ''
  }`;
  const forgotPasswordLink = `/forgot-password${
    programParam ? `?program=${encodeURIComponent(programParam)}` : ''
  }`;

  return (
    <AuthSplitLayout
      title="Welcome Back"
      subtitle="Sign in to your learning sanctuary and continue today’s progress."
      badgeText={programParam ? `Continuing to ${programParam}` : 'Student Portal'}
      quote="“The obstacle is not that you don't know enough. It is that you haven't given yourself permission to practice quietly.”"
      quoteAuthor="Naman — ABrainoConscious"
    >
      <div className="space-y-6">
        {/* Google OAuth Button */}
        <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} label="Continue with Google" />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#1A373E]" />
          <span className="absolute bg-[#081619] px-3 text-[11px] uppercase tracking-wider text-[#556B71]">
            or sign in with email
          </span>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {magicLinkSent ? (
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center animate-in fade-in">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">Sign-in Link Dispatched</h3>
              <p className="text-xs text-[#8D9FA4]">
                We sent a secure magic link to <strong className="text-white">{email}</strong>. Tap it to enter immediately.
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
              Back to Password Sign In
            </button>
          </div>
        ) : mode === 'password' ? (
          /* Password Form */
          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
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
                placeholder="Your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
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
              <Link to={forgotPasswordLink} className="text-amber-400 hover:text-amber-300 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={loading} className="w-full font-bold">
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </form>
        ) : (
          /* Magic Link Form */
          <form onSubmit={handleMagicLinkSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
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
              <Button type="submit" variant="primary" disabled={loading} className="w-full font-bold">
                {loading ? 'Dispatching Link...' : 'Send Magic Sign-In Link'}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-[#8D9FA4]">
          Don't have an account yet?{' '}
          <Link to={signupLink} className="font-semibold text-amber-400 hover:text-amber-300 hover:underline">
            Join Now &rarr;
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};
