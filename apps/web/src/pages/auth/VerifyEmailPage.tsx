import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthSplitLayout, useAuth, Button } from '@abrainoconscious/ui';
import { mapAuthError, getAppUrl } from '@abrainoconscious/shared';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { resendVerification } = useAuth();

  const email = searchParams.get('email') || '';
  const program = searchParams.get('program') || '';

  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setErrorMessage(null);
    setResendSuccess(false);

    try {
      const redirectQuery = program ? `?program=${encodeURIComponent(program)}` : '';
      const emailRedirectTo = `${getAppUrl('/auth/callback')}${redirectQuery}`;

      const { error } = await resendVerification(email, { emailRedirectTo });
      if (error) {
        setErrorMessage(mapAuthError(error));
        setResending(false);
        return;
      }

      setResendSuccess(true);
      setCooldown(60);
      setResending(false);
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setResending(false);
    }
  };

  const loginLink = `/login${program ? `?program=${encodeURIComponent(program)}` : ''}`;

  return (
    <AuthSplitLayout
      title="Check Your Inbox"
      subtitle="We sent a verification link to confirm your student email."
      quote="“Every worthwhile transformation starts with taking the first small, deliberate step.”"
      quoteAuthor="Naman — ABrainoConscious"
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Mail className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            Please check your email{email ? <strong className="text-white block mt-1">{email}</strong> : ''} and tap the
            confirmation button to activate your account.
          </p>
          <p className="text-[11px] text-[#556B71]">
            If you don't see it within a minute, check your Spam or Promotions folder.
          </p>
        </div>

        {resendSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>A fresh verification link was sent to your inbox.</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2 space-y-3">
          <Button
            variant="outline"
            disabled={cooldown > 0 || resending}
            onClick={handleResend}
            className="w-full text-xs font-semibold"
          >
            {resending
              ? 'Sending Link...'
              : cooldown > 0
              ? `Resend Verification Email (${cooldown}s)`
              : 'Resend Verification Email'}
          </Button>

          <div>
            <Link
              to={loginLink}
              className="inline-flex items-center gap-1.5 text-xs text-[#8D9FA4] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

