import React from 'react';
import { Radio, Play, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';
import { CountdownTimer } from './ProgressAndCountdown';
import { Button } from './Button';

export type HeroBannerVariant = 'live-now' | 'next-session' | 'continue-watching';

export interface HeroBannerProps {
  variant: HeroBannerVariant;
  title: string;
  subtitle: string;
  programTitle?: string;
  targetDate?: string | Date;
  lessonNumber?: number;
  duration?: string;
  onAction?: () => void;
  className?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  variant,
  title,
  subtitle,
  programTitle,
  targetDate,
  lessonNumber,
  duration,
  onAction,
  className
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#1A373E] bg-gradient-to-r from-[#081619] via-[#0E2024] to-[#152B30] p-6 sm:p-8 text-white shadow-2xl',
        variant === 'live-now' && 'border-red-500/40 from-[#150A0E] via-[#0E151A] to-[#0A171A]',
        className
      )}
    >
      {/* Decorative ambient radial */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2">
            {variant === 'live-now' && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-bold text-red-400 border border-red-500/40 animate-pulse">
                <Radio className="h-3.5 w-3.5" /> LIVE SESSION HAPPENING NOW
              </span>
            )}
            {variant === 'next-session' && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
                <Calendar className="h-3.5 w-3.5" /> UPCOMING SESSION
              </span>
            )}
            {variant === 'continue-watching' && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#00A884]/15 px-2.5 py-1 text-xs font-semibold text-[#00A884] border border-[#00A884]/30">
                <Play className="h-3.5 w-3.5" /> CONTINUE LEARNING
              </span>
            )}
            {programTitle && (
              <span className="text-xs text-[#8D9FA4] font-medium hidden sm:inline">
                • {programTitle}
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#F8FAFA]">
            {title}
          </h2>

          <p className="text-sm text-[#8D9FA4] leading-relaxed max-w-xl">
            {subtitle}
          </p>

          {variant === 'next-session' && targetDate && (
            <div className="pt-1">
              <CountdownTimer targetDate={targetDate} label="Session goes live in" />
            </div>
          )}

          {variant === 'continue-watching' && lessonNumber && (
            <p className="text-xs text-amber-400 font-medium">
              Lesson {lessonNumber} {duration ? `• ${duration}` : ''}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {variant === 'live-now' && (
            <Button
              size="lg"
              onClick={onAction}
              className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg"
            >
              <Radio className="h-4 w-4 mr-2" /> Join Live Now
            </Button>
          )}
          {variant === 'next-session' && (
            <Button size="lg" variant="primary" onClick={onAction}>
              View Schedule & Prep <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
          {variant === 'continue-watching' && (
            <Button size="lg" variant="primary" onClick={onAction}>
              <Play className="h-4 w-4 mr-2 fill-current" /> Resume Video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

