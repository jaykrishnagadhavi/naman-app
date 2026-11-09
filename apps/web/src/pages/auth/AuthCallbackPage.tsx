import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@abrainoconscious/ui';
import {
  sanitizeRedirectPath,
  sanitizeProgramSlug,
  mapAuthError,
  parseAuthCallbackParams,
  processOAuthCallback,
  stripAuthParamsFromUrl,
  isDev
} from '@abrainoconscious/shared';
import { Sparkles, AlertCircle, Clock, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@abrainoconscious/ui';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { supabase, refreshProfile } = useAuth();

  const [searchParams] = useState(() => new URLSearchParams(location.search));
  const programParam = sanitizeProgramSlug(searchParams.get('program'));
  const nextParam = sanitizeRedirectPath(searchParams.get('next'), '/');

  // Outcome status: strictly 'loading' until the final outcome is decided.
  // Never renders an error while an exchange is in flight or if a valid session exists.
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
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

    const runCallback = async () => {
      try {
        logStage('Stage 1: Parsing URL query and hash parameters');
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
              setStatus('error');
            }
            return;
          }
        }

        // Process OAuth code or token exchange with 10s maximum window
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

        // If session exists, proceed to profile hydration and destination resolution
        if (currentSession?.user) {
          logStage(`Stage 4: Session confirmed for user ID: ${currentSession.user.id}`);

          // Fetch user profile with safety timeout
          logStage('Stage 5: Fetching user profile to check onboarding status');
          let profile = null;
          try {
            profile = await refreshProfile();
            logStage(`Stage 5 outcome: profile fetched=${profile ? 'yes' : 'no'}, onboarding_completed=${profile?.onboarding_completed_at ? 'yes' : 'no'}`);
          } catch (profileErr) {
            logStage(`Stage 5 warning: profile fetch threw: ${profileErr instanceof Error ? profileErr.message : String(profileErr)}`);
          }

          if (isCancelled) return;

          // Determine destination
          if (!profile?.onboarding_completed_at) {
            const query = programParam ? `?program=${encodeURIComponent(programParam)}` : '';
            performNavigation(`/onboarding${query}`);
            return;
          }

          if (programParam) {
            performNavigation(`/programs/${programParam}`);
            return;
          }

          const target = nextParam && nextParam !== '/' ? nextParam : '/my-programs';
          performNavigation(target);
          return;
        }

        // If no session found so far, perform one final getSession check before ever showing error
        logStage('Stage 4: Checking final getSession before failure verdict');
        const { data: { session: finalSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (finalSession?.user) {
          logStage(`Final check: Session confirmed for user ID: ${finalSession.user.id}`);
          if (!isCancelled) {
            const target = programParam ? `/programs/${programParam}` : nextParam || '/my-programs';
            performNavigation(target);
          }
          return;
        }

        // Genuinely NO session exists after full exchange and final check
        logStage('Stage 4: Genuinely no session confirmed; transitioning to failure screen');
        if (!isCancelled) {
          setIsTimedOut(true);
          setErrorMessage(
            result.error ? mapAuthError(result.error) : 'Could not confirm sign in within 10 seconds.'
          );
          setStatus('error');
        }
      } catch (err) {
        logStage(`Exception caught: ${err instanceof Error ? err.message : String(err)}`);

        // Final resilient check: if session exists despite error, navigate!
        try {
          const { data: { session: recoverySession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (recoverySession?.user) {
            if (!isCancelled) {
              const target = programParam ? `/programs/${programParam}` : nextParam || '/my-programs';
              performNavigation(target);
            }
            return;
          }
        } catch {}

        if (!isCancelled) {
          setErrorMessage(mapAuthError(err as Error));
          setStatus('error');
        }
      }
    };

    runCallback();

    return () => {
      isCancelled = true;
    };
  }, [supabase, location.search, location.hash, programParam, nextParam, refreshProfile, navigate]);

  // Render ONLY a calm loading state until the outcome is final.
  // Never renders an error while an exchange is in flight, and never renders an error if getSession() is valid.
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#040C0E] p-6 text-center text-[#E1E8EA]">
        <div className="space-y-4">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-white">Verifying Your Session</h2>
            <p className="text-xs text-[#8D9FA4]">Connecting you to your growth dashboard...</p>
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
            {isTimedOut ? 'Sign-In Verification Timed Out' : 'Sign In Unsuccessful'}
          </h2>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            {isTimedOut
              ? "We couldn't confirm your sign-in within 10 seconds. Please try signing in again."
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
            <span>Try Signing In Again</span>
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
