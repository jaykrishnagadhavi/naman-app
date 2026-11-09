import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthSplitLayout, PasswordStrengthMeter, useAuth, Button } from '@abrainoconscious/ui';
import { ResetPasswordSchema, mapAuthError } from '@abrainoconscious/shared';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = ResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please verify your password inputs.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMessage(mapAuthError(error));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setErrorMessage(mapAuthError(err as Error));
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Set New Password"
      subtitle="Choose a secure password with at least 8 characters."
      quote="“Clarity begins with deliberate boundaries. Protect your focus and your sanctuary.”"
      quoteAuthor="Naman — ABrainoConscious"
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center animate-in fade-in">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">Password Updated</h3>
              <p className="text-xs text-[#8D9FA4]">
                Your new password is set. Redirecting you to sign in...
              </p>
            </div>
            <Link to="/login" className="inline-block text-xs font-semibold text-amber-400 hover:underline pt-2">
              Sign In Now &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-white">New Password</label>
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
              />
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] transition-colors focus:border-amber-500 focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full font-bold">
              {loading ? 'Updating Password...' : 'Save New Password & Continue'}
            </Button>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
};

