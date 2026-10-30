import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export interface EmpathyItem {
  id: string;
  question: string;
  subtext: string;
}

export interface EmpathyListProps {
  heading?: string;
  subheading?: string;
  items: EmpathyItem[];
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const EmpathyList: React.FC<EmpathyListProps> = ({
  heading = "Let's talk about YOU.",
  subheading = 'If any of these sound familiar, you are not broken. You are just navigating four heavy pillars with outdated tools.',
  items,
  ctaLabel = 'Yes, this is me — Show me the way forward',
  onCtaClick,
  className
}) => {
  return (
    <div className={cn('space-y-8 max-w-4xl mx-auto', className)}>
      <div className="text-center space-y-2">
        <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#142225]">
          {heading}
        </h3>
        <p className="text-sm text-[#52676B] max-w-xl mx-auto">
          {subheading}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3.5 rounded-xl border border-[#E0DBD0] bg-[#EFECE1] p-4 text-[#142225] shadow-sm hover:border-amber-600/40 transition-colors"
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600/15 text-amber-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#142225] leading-snug">
                {item.question}
              </h4>
              <p className="text-xs text-[#52676B] leading-relaxed">
                {item.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>

      {onCtaClick && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 active:bg-amber-800 transition-all hover:scale-[1.02]"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export interface StepItem {
  number: string; // '01', '02', '03', '04'
  title: string;
  description: string;
  detail: string;
}

export interface NumberedStepsProps {
  steps?: StepItem[];
  className?: string;
}

export const NumberedSteps: React.FC<NumberedStepsProps> = ({
  steps = [
    {
      number: '01',
      title: 'Watch the Framework',
      description: 'Concise, high-yield video lessons breaking down the psychology and system behind the struggle.',
      detail: 'Ad-free, self-paced, available on web and mobile.'
    },
    {
      number: '02',
      title: 'Do Today’s Daily Task',
      description: 'One realistic, 15-minute action workbook exercise to immediately apply the insight into your real life.',
      detail: 'Clear worksheets without complex jargon.'
    },
    {
      number: '03',
      title: 'Attend the Live Session',
      description: 'Show up for live interactive coaching calls with Naman to clear doubts and get direct guidance.',
      detail: 'Instant dashboard live link, recordings archived.'
    },
    {
      number: '04',
      title: 'Practise in Community',
      description: 'Share your progress, maintain daily streaks, and stay accountable with peer students walking the same path.',
      detail: 'Safe, moderated community without toxic hustle pressure.'
    }
  ],
  className
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {steps.map((step) => (
        <div
          key={step.number}
          className="relative flex flex-col justify-between rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 text-white shadow-ambient hover:border-amber-500/40 transition-colors"
        >
          <div className="space-y-3">
            <span className="font-serif text-3xl font-bold text-amber-500">
              {step.number}
            </span>
            <h4 className="font-serif text-lg font-semibold text-[#F8FAFA]">
              {step.title}
            </h4>
            <p className="text-xs text-[#8D9FA4] leading-relaxed">
              {step.description}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1A373E] text-[11px] text-amber-400 font-medium">
            {step.detail}
          </div>
        </div>
      ))}
    </div>
  );
};

