import React from 'react';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { formatIST } from '@abrainoconscious/shared';

export interface MissingLinkBannerProps {
  sessionTitle: string;
  scheduledAt: string;
  programTitle?: string;
  dayNumber?: number;
  onAddLink: () => void;
  className?: string;
}

export const MissingLinkBanner: React.FC<MissingLinkBannerProps> = ({
  sessionTitle,
  scheduledAt,
  programTitle,
  dayNumber,
  onAddLink,
  className = '',
}) => {
  return (
    <div
      className={`relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-950/70 via-red-900/40 to-[#0A1719] p-4 text-white shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-pulse-subtle ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
          <AlertTriangle className="h-5 w-5 animate-bounce" />
        </div>

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-red-400 text-xs tracking-wider uppercase">
              Action Required • Session Starts in &lt; 2 Hours
            </span>
            {dayNumber && (
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-300">
                DAY {dayNumber}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-white">
            Live link is missing for{' '}
            <span className="text-amber-400 font-bold">{sessionTitle}</span>
            {programTitle && <span className="text-[#A0B1B5]"> ({programTitle})</span>}
          </p>

          <p className="flex items-center gap-1.5 text-xs text-[#C5D5D8]">
            <Clock className="h-3 w-3 text-red-400" />
            Scheduled at: <span className="font-mono text-white">{formatIST(scheduledAt, true)}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddLink}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 px-4 py-2.5 text-xs font-bold text-black shadow hover:brightness-110 active:scale-95 transition-all shrink-0"
      >
        <span>Paste & Publish Link</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

