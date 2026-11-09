import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthSplitLayout, useAuth, Button } from '@abrainoconscious/ui';
import { ForgotPasswordSchema, mapAuthError, getAdminUrl } from '@abrainoconscious/shared';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const AdminForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = ForgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please enter a valid administrator email.');
      return;
    }

    setLoading(true);
    try {
      const resetRedirectUrl = getAdminUrl('/reset-password');
      const { error } = await sendPasswordReset(email.trim(), {
        redirectTo: resetRedirectUrl,
      });

      if (error) {
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Admin Password Recovery"
      subtitle="Enter your administrator email to receive a password creation or reset link."
      badgeText="Naman Studio Security"
      quote="“Admins start without a password and can set one securely through password recovery.”"
      quoteAuthor="Platform Security Spec"
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {sent ? (
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center animate-in fade-in">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">Recovery Link Sent</h3>
              <p className="text-xs text-[#8D9FA4] leading-relaxed">
                If an administrator account exists for <strong className="text-white">{email}</strong>, instructions to set your password have been sent.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-semibold text-amber-400 hover:underline">
                Return to Admin Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Administrator Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@abrainoconcious.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full font-bold">
              {loading ? 'Sending Instructions...' : 'Send Password Link'}
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#8D9FA4] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Admin Login</span>
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};

