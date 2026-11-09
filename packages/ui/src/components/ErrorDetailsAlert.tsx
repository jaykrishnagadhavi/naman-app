import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { type AppErrorDetails, extractAppError } from '@abrainoconscious/shared';

export interface ErrorDetailsAlertProps {
  error: AppErrorDetails | unknown;
  onDismiss?: () => void;
  title?: string;
  className?: string;
}

/**
 * Polished error alert banner designed for admin & student applications.
 * Directly surfaces PostgREST/PostgreSQL error codes (e.g. 42703, 23505, P0001)
 * and technical details/hints behind an expandable disclosure without obfuscation.
 */
export const ErrorDetailsAlert: React.FC<ErrorDetailsAlertProps> = ({
  error,
  onDismiss,
  title,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  if (!error) return null;

  const parsed =
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as AppErrorDetails)
      : extractAppError(error);

  const hasExtra = Boolean(parsed.code || parsed.details || parsed.hint);

  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-rose-200 transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {title && <h4 className="text-sm font-semibold text-rose-200 mb-0.5">{title}</h4>}
            <div className="text-sm text-rose-200/90 break-words flex items-center gap-2 flex-wrap">
              <span>{parsed.message}</span>
              {parsed.code && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-rose-900/60 text-rose-300 border border-rose-700/40">
                  Code: {parsed.code}
                </span>
              )}
            </div>

            {hasExtra && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Show details
                  </>
                )}
              </button>
            )}

            {expanded && (
              <div className="mt-3 rounded-lg bg-black/50 border border-rose-900/50 p-3 text-xs font-mono space-y-1.5 text-rose-200/80 overflow-x-auto">
                {parsed.code && (
                  <div>
                    <span className="text-rose-400 font-semibold">Code:</span> {parsed.code}
                  </div>
                )}
                {parsed.details && (
                  <div>
                    <span className="text-rose-400 font-semibold">Details:</span> {parsed.details}
                  </div>
                )}
                {parsed.hint && (
                  <div>
                    <span className="text-rose-400 font-semibold">Hint:</span> {parsed.hint}
                  </div>
                )}
                <div>
                  <span className="text-rose-400 font-semibold">Message:</span> {parsed.message}
                </div>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-400 hover:text-white transition-colors shrink-0 p-1"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

