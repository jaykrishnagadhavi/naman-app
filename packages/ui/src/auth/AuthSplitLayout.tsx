import React from 'react';
import { Sparkles } from 'lucide-react';

export interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  photoSrc?: string;
  quote?: string;
  quoteAuthor?: string;
  badgeText?: string;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({
  children,
  title,
  subtitle,
  photoSrc = '/img/naman/naman-header-960.webp',
  quote = '“You do not need to fix everything at once. You only need a quiet space, clear structure, and honest momentum.”',
  quoteAuthor = 'Naman — Founder & Mentor, ABrainoConscious',
  badgeText = 'ABrainoConscious Platform',
}) => {
  return (
    <div className="min-h-screen w-full bg-[#040C0E] text-[#E1E8EA] flex flex-col lg:grid lg:grid-cols-12">
      {/* Visual / Brand Panel (Desktop Only) */}
      <div className="hidden lg:relative lg:col-span-5 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-[#081619] border-r border-[#1A373E] p-12">
        {/* Background Photograph */}
        <div className="absolute inset-0 z-0">
          <img
            src={photoSrc}
            alt="Naman teaching live cohort"
            className="h-full w-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040C0E] via-[#040C0E]/70 to-[#040C0E]/40" />
          <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{badgeText}</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white">
            ABrainoConscious
          </h2>
          <p className="text-xs text-[#8D9FA4] max-w-sm leading-relaxed">
            Four growth pillars: Emotional, Mental, Academic, and Personal. Guided by Naman.
          </p>
        </div>

        {/* Inspiring Mentor Quote */}
        <div className="relative z-10 rounded-2xl border border-white/10 bg-[#081619]/80 p-6 backdrop-blur-md space-y-3">
          <p className="font-serif text-sm italic text-[#F8FAFA] leading-relaxed">
            {quote}
          </p>
          <div className="flex items-center gap-2 text-[11px] font-medium text-amber-400">
            <span>—</span>
            <span>{quoteAuthor}</span>
          </div>
        </div>
      </div>

      {/* Form Surface */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-12 sm:py-16 overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Header on Mobile and Desktop */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-400">
              <Sparkles className="h-3 w-3" />
              <span>ABrainoConscious</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#8D9FA4] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div className="rounded-2xl border border-[#1A373E] bg-[#081619]/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

