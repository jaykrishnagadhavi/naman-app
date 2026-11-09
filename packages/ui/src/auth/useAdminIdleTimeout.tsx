import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '../components/Button';

export interface UseAdminIdleTimeoutOptions {
  totalTimeoutMs?: number; // default: 30 minutes (1,800,000 ms)
  warningThresholdMs?: number; // default: 28 minutes (1,680,000 ms, warning shows for 2 min)
  enabled?: boolean;
}

/**
 * Monitors user activity for idle timeout in administrative contexts.
 * Shows warning after 28 minutes of inactivity, signs out after 30 minutes,
 * preserving intended route for smooth re-authentication.
 */
export function useAdminIdleTimeout({
  totalTimeoutMs = 30 * 60 * 1000,
  warningThresholdMs = 28 * 60 * 1000,
  enabled = true,
}: UseAdminIdleTimeoutOptions = {}) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  useEffect(() => {
    if (!enabled || !user) {
      if (timerRef.current) clearInterval(timerRef.current);
      setShowWarning(false);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleEvent = () => recordActivity();

    events.forEach((evt) => {
      window.addEventListener(evt, handleEvent, { passive: true });
    });

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= totalTimeoutMs) {
        // Timed out: sign out and preserve destination path
        if (timerRef.current) clearInterval(timerRef.current);
        const intendedPath = `${location.pathname}${location.search}`;
        signOut()
          .catch(console.warn)
          .finally(() => {
            navigate(`/login?next=${encodeURIComponent(intendedPath)}&reason=idle_timeout`, {
              replace: true,
            });
          });
      } else if (elapsed >= warningThresholdMs) {
        // Show warning
        setShowWarning(true);
        const remaining = Math.max(0, Math.floor((totalTimeoutMs - elapsed) / 1000));
        setSecondsRemaining(remaining);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleEvent);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, user, totalTimeoutMs, warningThresholdMs, location, signOut, navigate, recordActivity]);

  return {
    showWarning,
    secondsRemaining,
    staySignedIn: recordActivity,
  };
}

export interface AdminIdleWarningModalProps {
  show: boolean;
  secondsRemaining: number;
  onStaySignedIn: () => void;
}

export const AdminIdleWarningModal: React.FC<AdminIdleWarningModalProps> = ({
  show,
  secondsRemaining,
  onStaySignedIn,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-[#081619] p-6 text-center text-white shadow-2xl space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Clock className="h-6 w-6 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold">Session Inactivity Notice</h3>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            You've been away for a while. For creator safety and platform security, your admin session will lock in{' '}
            <span className="font-bold text-amber-400">{secondsRemaining} seconds</span>.
          </p>
        </div>

        <div className="pt-2">
          <Button variant="primary" className="w-full font-bold" onClick={onStaySignedIn}>
            I'm Still Working — Stay Signed In
          </Button>
        </div>
      </div>
    </div>
  );
};

