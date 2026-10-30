import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export interface ContentRailProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ContentRail: React.FC<ContentRailProps> = ({
  title,
  subtitle,
  action,
  children,
  className
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -380 : 380;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className={cn('relative py-6 space-y-4', className)}>
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F8FAFA] tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-[#8D9FA4] mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {action}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1A373E] bg-[#0E2024] text-[#8D9FA4] hover:border-amber-500/50 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1A373E] bg-[#0E2024] text-[#8D9FA4] hover:border-amber-500/50 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Snap Scroll Row */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
};

export default ContentRail;

