import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X, ExternalLink, Pin } from 'lucide-react';

export interface AnnouncementBannerProps {
  title: string;
  body: string;
  kind?: 'info' | 'success' | 'warning' | 'urgent';
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  isPinned?: boolean;
  onClose?: () => void;
  onCtaClick?: () => void;
  isPreview?: boolean;
  className?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  title,
  body,
  kind = 'info',
  ctaLabel,
  ctaUrl,
  isPinned = false,
  onClose,
  onCtaClick,
  isPreview = false,
  className = '',
}) => {
  const kindStyles = {
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/40',
      badge: 'bg-blue-500/20 text-blue-400',
      icon: Info,
      cta: 'bg-blue-500 text-black hover:bg-blue-400',
    },
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/40',
      badge: 'bg-emerald-500/20 text-emerald-400',
      icon: CheckCircle2,
      cta: 'bg-emerald-500 text-black hover:bg-emerald-400',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/40',
      badge: 'bg-amber-500/20 text-amber-400',
      icon: AlertTriangle,
      cta: 'bg-amber-500 text-black hover:bg-amber-400',
    },
    urgent: {
      border: 'border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.2)]',
      bg: 'bg-red-950/50',
      badge: 'bg-red-500/20 text-red-400 animate-pulse',
      icon: AlertOctagon,
      cta: 'bg-red-500 text-white hover:bg-red-600',
    },
  }[kind];

  const Icon = kindStyles.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${kindStyles.border} ${kindStyles.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${kindStyles.badge}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-sm font-bold text-white">{title}</span>
            {isPinned && (
              <span className="inline-flex items-center gap-1 rounded bg-[#1A373E] px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                <Pin className="h-2.5 w-2.5" />
                PINNED
              </span>
            )}
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${kindStyles.badge}`}>
              {kind}
            </span>
          </div>

          <div
            className="prose prose-invert prose-xs text-[#A0B1B5] leading-relaxed max-w-none"
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {ctaLabel && (
            <div className="pt-2">
              <a
                href={isPreview ? '#' : ctaUrl || '#'}
                onClick={(e) => {
                  if (isPreview) e.preventDefault();
                  if (onCtaClick) onCtaClick();
                }}
                target={isPreview ? undefined : '_blank'}
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow ${kindStyles.cta}`}
              >
                <span>{ctaLabel}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#8D9FA4] hover:bg-white/10 hover:text-white transition-all"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

