import React from 'react';
import { cn } from '@abrainoconscious/shared';

export interface StatItem {
  value: string;
  label: string;
  detail?: string;
}

export interface StatsStripProps {
  stats?: StatItem[];
  className?: string;
  variant?: 'dark' | 'paper';
}

export const StatsStrip: React.FC<StatsStripProps> = ({
  stats = [
    { value: '25,000+', label: 'Active Students', detail: 'Growing across 4 pillars' },
    { value: '18', label: 'Live Challenges & Courses', detail: 'Guided directly by Naman' },
    { value: '120+', label: 'Hours of Structured Video', detail: 'Ad-free in our private player' },
    { value: '98%', label: 'Completion Satisfaction', detail: 'Sample student benchmark' }
  ],
  className,
  variant = 'dark'
}) => {
  const isPaper = variant === 'paper';

  return (
    <div
      className={cn(
        'w-full py-8 border-y',
        isPaper
          ? 'bg-[#EFECE1] border-[#E0DBD0] text-[#142225]'
          : 'bg-[#081619] border-[#1A373E] text-[#F8FAFA]',
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-1">
            <div className={cn('font-serif text-3xl sm:text-4xl font-bold tracking-tight', isPaper ? 'text-[#142225]' : 'text-[#F5871F]')}>
              {stat.value}
            </div>
            <div className={cn('text-xs sm:text-sm font-semibold', isPaper ? 'text-[#142225]' : 'text-white')}>
              {stat.label}
            </div>
            {stat.detail && (
              <div className={cn('text-[11px]', isPaper ? 'text-[#52676B]' : 'text-[#8D9FA4]')}>
                {stat.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsStrip;

