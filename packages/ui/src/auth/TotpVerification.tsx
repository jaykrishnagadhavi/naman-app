import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { ShieldCheck, KeyRound, CheckCircle2, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '../components/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../components/Dialog';

export interface TotpEnrollmentManagerProps {
  onSuccess?: () => void;
}

/**
 * Manages TOTP 2FA enrollment inside Admin Settings.
 * Displays QR code, secret key, verification input, and unenroll capability.
 */
export const TotpEnrollmentManager: React.FC<TotpEnrollmentManagerProps> = ({ onSuccess }) => {
  const { supabase, user } = useAuth();

  const [factors, setFactors] = useState<Array<{ id: string; friendly_name?: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
    uri: string;
  } | null>(null);

  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const loadFactors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verified = (data.totp || []).filter((f) => f.status === 'verified');
        setFactors(verified);
      }
    } catch (err) {
      console.warn('Failed listing MFA factors:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const handleStartEnrollment = async () => {
    setEnrolling(true);
    setVerifyError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Naman Admin Authenticator (${user?.email || 'Naman'})`,
      });

      if (error) {
        setVerifyError(error.message);
        setEnrolling(false);
        return;
      }

      if (data && data.totp) {
        setEnrollData({
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        });
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to initiate MFA enrollment');
      setEnrolling(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!enrollData || verifyCode.trim().length !== 6) {
      setVerifyError('Please enter a 6-digit authentication code.');
      return;
    }

    setVerifyError(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: verifyCode.trim(),
      });

      if (error) {
        setVerifyError(error.message);
        return;
      }

      setEnrollData(null);
      setEnrolling(false);
      setVerifyCode('');
      await loadFactors();
      onSuccess?.();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleUnenroll = async (factorId: string) => {
    if (!window.confirm('Are you sure you want to disable 2-Step Verification for this authenticator app?')) {
      return;
    }

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        alert(`Failed to unenroll factor: ${error.message}`);
        return;
      }
      await loadFactors();
    } catch (err) {
      alert(`Error unenrolling: ${err instanceof Error ? err.message : 'Unexpected error'}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-xs text-[#8D9FA4]">
        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-amber-500" />
        Checking two-step verification status...
      </div>
    );
  }

  const isEnrolled = factors.length > 0;

  return (
    <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6 text-[#E1E8EA]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isEnrolled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
          >
            {isEnrolled ? <ShieldCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <span>Two-Step Verification (TOTP 2FA)</span>
              {isEnrolled && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-[#8D9FA4]">
              Protect your administrative account with Google Authenticator, 1Password, or Authy.
            </p>
          </div>
        </div>

        {!isEnrolled && !enrolling && (
          <Button variant="primary" size="sm" onClick={handleStartEnrollment}>
            Enable 2FA Authenticator
          </Button>
        )}
      </div>

      {/* Enrolled View */}
      {isEnrolled && !enrolling && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Your administrator account is protected with AAL2 authentication.</p>
              <p className="text-[11px] text-[#8D9FA4] mt-0.5">
                Every login to Naman Studio requires your 6-digit TOTP code in addition to your credentials.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">Active Authenticator Apps</h4>
            {factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-white font-medium">{f.friendly_name || 'TOTP Device'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnenroll(f.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Disable / Unenroll
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrollment Flow */}
      {enrolling && enrollData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#1A373E] bg-white text-center">
              <img
                src={enrollData.qrCode}
                alt="Scan TOTP QR code"
                className="h-48 w-48 object-contain"
              />
              <p className="text-[11px] text-zinc-700 mt-2 font-medium">
                Scan with Google Authenticator or 1Password
              </p>
            </div>

            {/* Secret & Instructions */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <h4 className="font-semibold text-white">Can't scan the QR code?</h4>
                <p className="text-[#8D9FA4]">Copy this secret key and enter it manually into your authenticator app:</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 font-mono text-[11px] text-amber-400 select-all overflow-x-auto">
                    {enrollData.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => copyToClipboard(enrollData.secret)}
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-white">
                  Enter the 6-Digit Code Generated by Your App
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
                {verifyError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{verifyError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="primary" className="flex-1" onClick={handleConfirmVerification}>
                  Confirm & Enable 2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnrolling(false);
                    setEnrollData(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface TotpChallengeModalProps {
  show: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Prompt shown at login when a user has enrolled TOTP factors (AAL2 challenge).
 */
export const TotpChallengeModal: React.FC<TotpChallengeModalProps> = ({ show, onSuccess, onCancel }) => {
  const { supabase } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError || !factorsData?.totp?.length) {
        setError('No enrolled TOTP factor found for this account.');
        setVerifying(false);
        return;
      }

      const factorId = factorsData.totp[0].id;
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid authentication code.');
        setVerifying(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify TOTP code.');
      setVerifying(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent size="sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-center sm:text-center pr-0">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="font-serif text-lg font-bold text-white mt-2">Two-Step Verification</DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-muted,#8D9FA4)]">
              Enter the 6-digit code from your authenticator app to enter Naman Studio.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold rounded-lg border border-[var(--color-border,#1A373E)] bg-[var(--color-surface-2,#040C0E)] px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
            />

            {error && (
              <p className="text-[11px] text-red-400 text-center flex items-center justify-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </DialogBody>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="primary" type="submit" disabled={verifying} className="w-full font-bold">
              {verifying ? 'Verifying Code...' : 'Verify & Continue'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="w-full text-xs text-[#8D9FA4] hover:text-white"
            >
              Cancel & Sign Out
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
