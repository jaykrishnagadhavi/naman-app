import React, { useState } from 'react';
import { Check, ShieldCheck, Play, ArrowRight } from 'lucide-react';
import { cn, formatPaise } from '@abrainoconscious/shared';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Feedback';
import { Button } from './Button';

// Pricing Card
export interface PricingCardProps {
  title: string;
  badge?: string;
  description: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  features: string[];
  isFeatured?: boolean;
  ctaText?: string;
  onJoin?: () => void;
  className?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  badge,
  description,
  pricePaise,
  compareAtPricePaise,
  features,
  isFeatured = false,
  ctaText = 'Join Program Now',
  onJoin,
  className
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 text-white shadow-xl',
        isFeatured
          ? 'border-amber-500 bg-gradient-to-b from-[#152B30] to-[#081619] shadow-glow scale-[1.02]'
          : 'border-[#1A373E] bg-[#0E2024] hover:border-[#1A373E]/80',
        className
      )}
    >
      {badge && (
        <div className="absolute -top-3.5 left-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1 text-xs font-bold text-black shadow-md uppercase tracking-wide">
          {badge}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <h4 className="font-serif text-2xl font-bold text-[#F8FAFA]">{title}</h4>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">{description}</p>
        </div>

        <div className="flex items-baseline gap-2 pt-2 border-t border-[#1A373E]">
          <span className="font-serif text-4xl font-bold text-white">
            {formatPaise(pricePaise)}
          </span>
          {compareAtPricePaise && (
            <span className="text-sm text-[#8D9FA4] line-through">
              {formatPaise(compareAtPricePaise)}
            </span>
          )}
          <span className="text-xs text-amber-400 font-semibold ml-1">One-time payment</span>
        </div>

        <div className="space-y-3 pt-2">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wider block">
            What's Included:
          </span>
          {features.map((feat, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-[#E1E8EA]">
              <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 space-y-3">
        <Button
          variant={isFeatured ? 'cta' : 'primary'}
          size="lg"
          onClick={onJoin}
          className="w-full text-sm"
        >
          {ctaText} <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8D9FA4]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>7-Day Money-Back Guarantee</span>
        </div>
      </div>
    </div>
  );
};

// FAQ Accordion
export interface FaqItem {
  question: string;
  answer: string;
}

export const FaqAccordion: React.FC<{ items: FaqItem[]; className?: string }> = ({
  items,
  className
}) => {
  return (
    <Accordion type="single" collapsible className={cn('w-full space-y-3', className)}>
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          value={`item-${idx}`}
          className="rounded-xl border border-[#1A373E] bg-[#081619] px-5 py-1 text-white shadow-ambient data-[state=open]:border-amber-500/40"
        >
          <AccordionTrigger className="font-serif text-sm sm:text-base font-semibold text-[#F8FAFA] hover:text-amber-400 text-left py-4">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-xs text-[#8D9FA4] leading-relaxed pb-4 pt-1 border-t border-[#1A373E]/50">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

// YouTube Privacy-Enhanced Video Card
export interface YouTubeVideoCardProps {
  videoId: string;
  title: string;
  duration?: string;
  thumbnailUrl?: string;
  className?: string;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  videoId,
  title,
  duration,
  thumbnailUrl,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={cn('group overflow-hidden rounded-2xl border border-[#1A373E] bg-[#0E2024] shadow-ambient text-white flex flex-col', className)}>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            className="relative h-full w-full cursor-pointer group"
          >
            <img
              src={thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform group-hover:scale-110">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
            </div>
            {duration && (
              <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                {duration}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-1">
        <h4 className="font-serif text-sm font-semibold text-[#F8FAFA] line-clamp-2">
          {title}
        </h4>
        <span className="text-[11px] text-amber-400 font-medium">Free on YouTube</span>
      </div>
    </div>
  );
};

// Pillar Card
export interface PillarCardProps {
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  accentColor?: string;
  programsCount?: number;
  onClick?: () => void;
  className?: string;
}

export const PillarCard: React.FC<PillarCardProps> = ({
  title,
  tagline,
  description,
  icon,
  programsCount = 3,
  onClick,
  className
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex flex-col justify-between rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 text-white shadow-ambient transition-all duration-300 hover:border-amber-500/50 hover:shadow-lift hover:-translate-y-1 cursor-pointer select-none',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#152B30] text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            {tagline}
          </span>
          <h4 className="font-serif text-xl font-bold text-[#F8FAFA] mt-0.5">
            {title}
          </h4>
        </div>
        <p className="text-xs text-[#8D9FA4] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-3 border-t border-[#1A373E] flex items-center justify-between text-xs text-[#8D9FA4]">
        <span>{programsCount} Programs Available</span>
        <span className="text-amber-500 font-medium group-hover:translate-x-1 transition-transform">
          Explore &rarr;
        </span>
      </div>
    </div>
  );
};

// Sticky Mobile Bottom CTA Bar
export interface StickyCtaBarProps {
  title?: string;
  pricePaise?: number;
  onJoin: () => void;
  className?: string;
}

export const StickyCtaBar: React.FC<StickyCtaBarProps> = ({
  title = 'Join ABrainoConscious',
  pricePaise = 99900,
  onJoin,
  className
}) => {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 block sm:hidden border-t border-[#1A373E] bg-[#081619]/95 px-4 py-3 backdrop-blur-md text-white shadow-2xl',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-xs font-bold text-[#F8FAFA] truncate">{title}</p>
          <div className="flex items-baseline gap-1.5 text-xs">
            <span className="font-bold text-amber-500">{formatPaise(pricePaise)}</span>
            <span className="text-[10px] text-[#8D9FA4]">7-day refund guarantee</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onJoin}
          className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-amber-400 active:bg-amber-600 transition-colors"
        >
          JOIN NOW
        </button>
      </div>
    </div>
  );
};

// Join Button with subtle 'Already a member? Login' link
export const JoinButton: React.FC<{
  onJoin?: () => void;
  onLogin?: () => void;
  label?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ onJoin, onLogin, label = 'JOIN NOW', size = 'lg', className }) => {
  return (
    <div className={cn('inline-flex flex-col sm:flex-row sm:items-center gap-3', className)}>
      <Button variant="cta" size={size} onClick={onJoin}>
        {label}
      </Button>
      {onLogin && (
        <button
          type="button"
          onClick={onLogin}
          className="text-xs text-[#8D9FA4] hover:text-white transition-colors underline underline-offset-4"
        >
          Already a member? Login
        </button>
      )}
    </div>
  );
};

