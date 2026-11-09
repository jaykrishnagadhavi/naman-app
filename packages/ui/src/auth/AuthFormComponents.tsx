import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordStrengthMeterProps {
  password: string;
}

export function computePasswordScore(password: string): {
  score: number;
  label: string;
  color: string;
  requirements: Array<{ label: string; met: boolean }>;
} {
  const reqs = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains lowercase & uppercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Contains a number (0-9)', met: /\d/.test(password) },
    { label: 'Contains a symbol or special character', met: /[^a-zA-Z0-9]/.test(password) },
  ];

  const metCount = reqs.filter((r) => r.met).length;

  let label = 'Enter password';
  let color = 'bg-zinc-700';

  if (password.length > 0) {
    if (metCount <= 1) {
      label = 'Weak';
      color = 'bg-red-500';
    } else if (metCount === 2) {
      label = 'Fair';
      color = 'bg-amber-500';
    } else if (metCount === 3) {
      label = 'Good';
      color = 'bg-sky-500';
    } else {
      label = 'Strong';
      color = 'bg-emerald-500';
    }
  }

  return {
    score: metCount,
    label,
    color,
    requirements: reqs,
  };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const { score, label, color, requirements } = computePasswordScore(password);

  return (
    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#8D9FA4]">Password strength:</span>
        <span className="font-semibold text-white">{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-colors duration-300 ${
              score >= step ? color : 'bg-[#1A373E]'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[10px] text-[#8D9FA4]">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {req.met ? (
              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-zinc-600 shrink-0" />
            )}
            <span className={req.met ? 'text-[#E1E8EA]' : 'text-zinc-500'}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  label = 'Continue with Google',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#1A373E] bg-[#0E2024] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#132A30] hover:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
        />
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
        />
        <path
          fill="#FBBC05"
          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
        />
        <path
          fill="#34A853"
          d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
        />
      </svg>
      <span>{loading ? 'Connecting to Google...' : label}</span>
    </button>
  );
};

