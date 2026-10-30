import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export interface BadgeTileProps {
  title: string;
  description: string;
  pillar?: string;
  isEarned?: boolean;
  earnedDate?: string;
  iconName?: string;
  className?: string;
}

export const BadgeTile: React.FC<BadgeTileProps> = ({
  title,
  description,
  pillar,
  isEarned = false,
  earnedDate,
  className
}) => {
  return (
    <div
      className={cn(
        'group relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200 select-none',
        isEarned
          ? 'bg-gradient-to-b from-[#0E2024] to-[#081619] border-amber-500/40 shadow-glow'
          : 'bg-[#081619]/60 border-[#1A373E] opacity-60 hover:opacity-80',
        className
      )}
    >
      {/* Icon Badge Emblem */}
      <div
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner mb-3 transition-transform group-hover:scale-105',
          isEarned
            ? 'border-amber-500/50 bg-[#152B30] text-[#F5871F]'
            : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4]'
        )}
      >
        <Award className="h-8 w-8" />
        {isEarned ? (
          <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 fill-[#00A884] text-black" />
        ) : (
          <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-[#8D9FA4]" />
        )}
      </div>

      {pillar && (
        <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider mb-1">
          {pillar}
        </span>
      )}

      <h4 className="font-serif text-sm font-semibold text-[#F8FAFA] line-clamp-1">
        {title}
      </h4>

      <p className="mt-1 text-[11px] text-[#8D9FA4] line-clamp-2">
        {description}
      </p>

      {isEarned && earnedDate && (
        <span className="mt-2 text-[10px] text-[#00A884] font-medium">
          Earned {earnedDate}
        </span>
      )}
    </div>
  );
};

export default BadgeTile;

