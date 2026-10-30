import React from 'react';
import { cn } from '@abrainoconscious/shared';

export interface SectionBandProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'dark' | 'paper';
  containerClassName?: string;
}

export const SectionBand = React.forwardRef<HTMLElement, SectionBandProps>(
  ({ variant = 'dark', className, containerClassName, children, ...props }, ref) => {
    const isPaper = variant === 'paper';

    return (
      <section
        ref={ref}
        className={cn(
          'w-full py-16 sm:py-24 transition-colors',
          isPaper
            ? 'bg-[#F7F4EB] text-[#142225]'
            : 'bg-[#040C0E] text-[#E1E8EA]',
          className
        )}
        {...props}
      >
        <div className={cn('max-w-6xl mx-auto px-4 sm:px-6 lg:px-8', containerClassName)}>
          {children}
        </div>
      </section>
    );
  }
);
SectionBand.displayName = 'SectionBand';

export interface StoryPanelProps {
  number: string; // '01', '02', etc.
  title: string;
  beforeText: string;
  afterText: string;
  pillar: string;
  illustrationSvg?: React.ReactNode;
  className?: string;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({
  number,
  title,
  beforeText,
  afterText,
  pillar,
  illustrationSvg,
  className
}) => {
  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-2xl border border-[#E0DBD0] bg-[#EFECE1] p-6 shadow-sm transition-all duration-300 hover:border-amber-600/40 hover:shadow-md text-[#142225]',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-serif text-2xl font-bold text-amber-700">{number}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52676B] bg-[#E3DFD2] px-2.5 py-0.5 rounded-full">
            {pillar}
          </span>
        </div>

        {illustrationSvg && (
          <div className="flex h-32 w-full items-center justify-center rounded-xl bg-[#E5E1D5] overflow-hidden text-[#142225]/70 p-4">
            {illustrationSvg}
          </div>
        )}

        <h4 className="font-serif text-lg font-bold text-[#142225] leading-snug">
          {title}
        </h4>

        <div className="space-y-3 pt-1 text-xs">
          <div className="rounded-xl bg-[#E5E0D3] p-3 border border-[#D9D3C4]">
            <span className="font-bold text-red-800 uppercase tracking-wider text-[10px] block mb-1">
              Before • The Friction
            </span>
            <p className="text-[#3F4F52] leading-relaxed">{beforeText}</p>
          </div>

          <div className="rounded-xl bg-[#DCE8E1] p-3 border border-[#C5D9CE]">
            <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">
              After • The Growth Shift
            </span>
            <p className="text-[#1E3E2F] leading-relaxed">{afterText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

