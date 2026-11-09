import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, ExternalLink, Pin, Clock } from 'lucide-react';
import { formatIST } from '@abrainoconscious/shared';

export interface AnnouncementInboxCardProps {
  title: string;
  body: string;
  kind?: 'info' | 'success' | 'warning' | 'urgent';
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  publishAt?: string;
  isPinned?: boolean;
  isRead?: boolean;
  onRead?: () => void;
  isPreview?: boolean;
  className?: string;
}

export const AnnouncementInboxCard: React.FC<AnnouncementInboxCardProps> = ({
  title,
  body,
  kind = 'info',
  ctaLabel,
  ctaUrl,
  publishAt = new Date().toISOString(),
  isPinned = false,
  isRead = false,
  onRead,
  isPreview = false,
  className = '',
}) => {
  const kindStyles = {
    info: {
      dot: 'bg-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: Info,
    },
    success: {
      dot: 'bg-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
    },
    warning: {
      dot: 'bg-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: AlertTriangle,
    },
    urgent: {
      dot: 'bg-red-400',
      badge: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: AlertOctagon,
    },
  }[kind];

  const Icon = kindStyles.icon;

  return (
    <div
      onClick={onRead}
      className={`group relative rounded-xl border p-4 transition-all duration-200 ${
        isRead
          ? 'border-[#1A373E]/60 bg-[#081619] opacity-80 hover:opacity-100'
          : 'border-[#234A54] bg-[#0A1F24] hover:border-amber-500/30'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        <div className="mt-1 flex flex-col items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${isRead ? 'bg-transparent' : kindStyles.dot}`}
            title={isRead ? 'Read' : 'Unread'}
          />
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1A373E] bg-[#061214] text-[#8D9FA4]">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-serif text-sm font-bold ${isRead ? 'text-[#C5D5D8]' : 'text-white'}`}>
                {title}
              </span>
              {isPinned && (
                <span className="inline-flex items-center gap-1 rounded bg-[#1A373E] px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Pin className="h-2.5 w-2.5" />
                  PINNED
                </span>
              )}
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${kindStyles.badge}`}>
                {kind}
              </span>
            </div>

            <span className="flex items-center gap-1 text-[11px] text-[#8D9FA4]">
              <Clock className="h-3 w-3" />
              {formatIST(publishAt, true)}
            </span>
          </div>

          <div
            className="prose prose-invert prose-xs text-[#8D9FA4] leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all"
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {ctaLabel && (
            <div className="pt-1.5">
              <a
                href={isPreview ? '#' : ctaUrl || '#'}
                onClick={(e) => isPreview && e.preventDefault()}
                target={isPreview ? undefined : '_blank'}
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all underline underline-offset-4"
              >
                <span>{ctaLabel}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

