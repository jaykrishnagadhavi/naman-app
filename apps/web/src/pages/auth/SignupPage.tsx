import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  AuthSplitLayout,
  GoogleButton,
  PasswordStrengthMeter,
  useAuth,
  Button
} from '@abrainoconscious/ui';
import {
  SignupSchema,
  mapAuthError,
  sanitizeProgramSlug,
  getAppUrl
} from '@abrainoconscious/shared';
import { Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signInWithGoogle } = useAuth();

  const programParam = sanitizeProgramSlug(searchParams.get('program'));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const redirectQuery = programParam ? `?program=${encodeURIComponent(programParam)}` : '';
      const callbackUrl = `${getAppUrl('/auth/callback')}${redirectQuery}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = SignupSchema.safeParse({
      fullName,
      email,
      password,
      termsAccepted,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please check your inputs.');
      return;
    }

    setLoading(true);
    try {
      const redirectQuery = programParam ? `?program=${encodeURIComponent(programParam)}` : '';
      const emailRedirectTo = `${getAppUrl('/auth/callback')}${redirectQuery}`;

      const { error } = await signUp(email, password, {
        fullName: fullName.trim(),
        emailRedirectTo,
      });

      if (error) {
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      // If user is returned and identities are empty, or confirmation email is required
      navigate(`/verify-email?email=${encodeURIComponent(email)}${programParam ? `&program=${encodeURIComponent(programParam)}` : ''}`);
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  const loginLink = `/login${programParam ? `?program=${encodeURIComponent(programParam)}` : ''}`;

  return (
    <AuthSplitLayout
      title="Begin Your Growth Journey"
      subtitle="Create your student account to join live challenges, daily tasks, and self-growth courses."
      badgeText={programParam ? `Joining ${programParam}` : 'Four Growth Pillars'}
      quote="“Showing up honestly is more than half the battle. Everything else is structured step by step.”"
      quoteAuthor="Naman — ABrainoConscious"
    >
      <div className="space-y-6">
        {/* Google OAuth Button */}
        <GoogleButton onClick={handleGoogleSignup} loading={googleLoading} label="Continue with Google" />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#1A373E]" />
          <span className="absolute bg-[#081619] px-3 text-[11px] uppercase tracking-wider text-[#556B71]">
            or sign up with email
          </span>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">Full Name</label>
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
            />
          </div>

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
              <label className="block text-xs font-semibold text-white">Create Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#8D9FA4] hover:text-white flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
              />
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Terms & Privacy Consent */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#1A373E] bg-[#040C0E] text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
              />
              <span className="text-[11px] text-[#8D9FA4] leading-relaxed">
                I agree to the{' '}
                <a href="#terms" className="text-amber-400 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-amber-400 hover:underline">
                  Privacy Policy
                </a>
                . All content is educational and not clinical mental healthcare.
              </span>
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-[#8D9FA4]">
          Already have an account?{' '}
          <Link to={loginLink} className="font-semibold text-amber-400 hover:text-amber-300 hover:underline">
            Sign In &rarr;
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};
