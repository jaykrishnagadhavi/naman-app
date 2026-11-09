import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, Button } from '@abrainoconscious/ui';
import {
  sanitizeRedirectPath,
  mapAuthError,
  parseAuthCallbackParams,
  processOAuthCallback,
  stripAuthParamsFromUrl,
  getAppUrl,
  isDev
} from '@abrainoconscious/shared';
import { Sparkles, AlertCircle, ShieldAlert, ArrowRight, LogOut, Clock, ChevronDown, RefreshCw } from 'lucide-react';

export const AdminAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { supabase, signOut } = useAuth();

  const [searchParams] = useState(() => new URLSearchParams(location.search));
  const nextParam = sanitizeRedirectPath(searchParams.get('next'), '/');

  // Outcome status: strictly 'loading' until the final outcome is decided.
  // Never renders an error while in flight or if a valid session exists.
  const [outcome, setOutcome] = useState<'loading' | 'error' | 'denied'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [stages, setStages] = useState<string[]>([]);

  // Persistent reference ensuring navigation is executed exactly once across Strict Mode mounts
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const logStage = (stage: string) => {
      setStages((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${stage}`]);
    };

    const performNavigation = (target: string) => {
      if (isCancelled || hasNavigatedRef.current) {
        logStage(`Navigation suppressed: cancelled=${isCancelled}, already_navigated=${hasNavigatedRef.current}`);
        return;
      }
      hasNavigatedRef.current = true;
      stripAuthParamsFromUrl();
      logStage(`Executing single replace navigation to -> ${target}`);
      navigate(target, { replace: true });
    };

    const processAuth = async () => {
      try {
        logStage('Stage 1: Parsing Admin URL query and hash parameters');
        const parsed = parseAuthCallbackParams(location.search, location.hash);
        logStage(`Stage 1 outcome: code=${parsed.code ? 'yes' : 'no'}, hash_tokens=${parsed.accessToken ? 'yes' : 'no'}, err=${parsed.error || 'none'}`);

        // If URL contains an error parameter, first check if user already has an active session
        if (parsed.error) {
          const { data: { session: existingSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (existingSession?.user) {
            logStage('Stage 1 notice: URL contained error param but valid session exists; continuing');
          } else {
            logStage(`Stage 1 error detected in URL: ${parsed.errorDescription || parsed.error}`);
            if (!isCancelled) {
              setErrorMessage(parsed.errorDescription || parsed.error);
              setOutcome('error');
            }
            return;
          }
        }

        // Deterministically process OAuth code with 10s maximum window
        logStage('Stage 2: Initiating processOAuthCallback with single-exchange guard');
        const result = await processOAuthCallback({
          supabase,
          code: parsed.code,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          timeoutMs: 10000,
          onStage: (s) => logStage(s),
        });

        if (isCancelled) {
          logStage('Mount cancelled; suppressing post-exchange state/navigation');
          return;
        }

        logStage(`Stage 3: processOAuthCallback completed: success=${result.success}`);

        // Resilient session check: ensure user session actually exists
        let currentSession = result.session;
        if (!currentSession?.user) {
          logStage('Stage 4: Checking direct getSession fallback');
          const { data: { session: fallbackSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          currentSession = fallbackSession;
        }

        if (isCancelled) return;

        if (!currentSession?.user) {
          // Perform one final check before showing error
          const { data: { session: finalCheck } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (finalCheck?.user) {
            currentSession = finalCheck;
          } else {
            logStage('Stage 4: Genuinely no session confirmed after window; transitioning to failure screen');
            if (!isCancelled) {
              setIsTimedOut(true);
              setErrorMessage(
                result.error ? mapAuthError(result.error) : 'Could not confirm admin authorization within 10 seconds.'
              );
              setOutcome('error');
            }
            return;
          }
        }

        logStage(`Stage 4: Session confirmed for admin user ID: ${currentSession.user.id}`);

        // Verify that the user possesses admin or staff role (with 3s timeout guard)
        logStage('Stage 5: Verifying admin or staff role from profiles table');
        const rolePromise = supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        const roleTimeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('Role check timeout after 3s') }), 3000)
        );

        const { data: profileData, error: profileError } = await Promise.race([rolePromise, roleTimeoutPromise]);

        if (isCancelled) return;

        logStage(`Stage 5 outcome: profileData role=${profileData?.role || 'none'}, err=${profileError?.message || 'none'}`);

        if (profileError || !profileData || !['admin', 'staff'].includes(profileData.role)) {
          logStage('Stage 5 Access Denied: User role is not admin or staff; revoking session');
          await signOut();
          if (!isCancelled) {
            setOutcome('denied');
          }
          return;
        }

        // Check MFA authenticator assurance level
        logStage('Stage 6: Checking MFA AAL status');
        try {
          const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
            const mfaTarget = `/login?next=${encodeURIComponent(nextParam)}&mfa=required`;
            logStage(`Redirecting to MFA prompt -> ${mfaTarget}`);
            performNavigation(mfaTarget);
            return;
          }
        } catch (mfaErr) {
          logStage(`MFA check notice: ${mfaErr instanceof Error ? mfaErr.message : String(mfaErr)}`);
        }

        logStage(`Stage 6: Redirecting to admin destination -> ${nextParam}`);
        performNavigation(nextParam);
      } catch (err) {
        logStage(`Exception caught: ${err instanceof Error ? err.message : String(err)}`);

        // Resilient recovery check: if session exists despite error, verify role and navigate
        try {
          const { data: { session: recoverySession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (recoverySession?.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', recoverySession.user.id)
              .single();

            if (profileData && ['admin', 'staff'].includes(profileData.role)) {
              logStage(`Recovery redirect to -> ${nextParam}`);
              performNavigation(nextParam);
              return;
            }
          }
        } catch {}

        if (!isCancelled) {
          setErrorMessage(mapAuthError(err as Error));
          setOutcome('error');
        }
      }
    };

    processAuth();

    return () => {
      isCancelled = true;
    };
  }, [supabase, location.search, location.hash, nextParam, navigate, signOut]);

  // Render ONLY a calm loading state until the outcome is final.
  // Never renders an error while an exchange is in flight, and never renders an error if getSession() is valid.
  if (outcome === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
        <div className="space-y-4">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-white">Verifying Studio Credentials</h2>
            <p className="text-xs text-[#8D9FA4]">Connecting to Naman Studio console...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render Access Denied screen if verified non-admin/staff role
  if (outcome === 'denied') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
        <div className="max-w-md space-y-6 rounded-2xl border border-red-500/30 bg-[#081619] p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-white">Access Denied</h2>
            <p className="text-xs text-[#8D9FA4] leading-relaxed">
              This studio portal is restricted exclusively to ABrainoConscious administrators and staff.
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
              onClick={() => navigate('/login', { replace: true })}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign In with Different Account</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render failure screen only after the exchange has finished and a final getSession check confirmed no session
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
      <div className="max-w-md w-full space-y-4 rounded-2xl border border-red-500/30 bg-[#081619] p-8 shadow-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
          {isTimedOut ? <Clock className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
        </div>

        <div className="space-y-1">
          <h2 className="font-serif text-xl font-bold text-white">
            {isTimedOut ? 'Admin Verification Timed Out' : 'Authentication Unsuccessful'}
          </h2>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            {isTimedOut
              ? "We couldn't confirm your administrator authorization within 10 seconds. Please try signing in again."
              : errorMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate('/login', { replace: true })}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Return to Admin Sign In</span>
          </Button>
        </div>

        {/* Dev-Only Diagnostic Panel */}
        {isDev() && stages.length > 0 && (
          <details className="mt-4 text-left border border-[#1A373E] bg-[#040C0E] rounded-xl p-3 text-[11px] text-[#8D9FA4] group">
            <summary className="cursor-pointer font-mono font-semibold text-amber-400 flex items-center justify-between select-none">
              <span>Dev Diagnostic Trace ({stages.length} events)</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2.5 max-h-48 overflow-y-auto space-y-1 font-mono text-[10px] text-[#A2B4B8] border-t border-[#1A373E] pt-2">
              {stages.map((st, i) => (
                <div key={i} className="leading-tight">{st}</div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};
