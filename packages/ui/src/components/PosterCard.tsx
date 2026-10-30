import React from 'react';
import { cn, formatPaise } from '@abrainoconscious/shared';
import { Play } from 'lucide-react';
import { Img } from './Img';
import { ProgressRing } from './ProgressAndCountdown';

export interface PosterCardProps {
  id: string;
  title: string;
  category?: string;
  coverImage?: string;
  imageId?: string;
  aspectRatio?: '2:3' | '16:9';
  rankNumber?: number; // 1-10 for Trending rail variant
  lessonCount?: number;
  pricePaise?: number;
  compareAtPricePaise?: number;
  progressPercent?: number; // if user is enrolled
  onPreview?: () => void;
  onSelect?: () => void;
  className?: string;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  title,
  category,
  coverImage,
  imageId,
  aspectRatio = '2:3',
  rankNumber,
  lessonCount,
  pricePaise,
  compareAtPricePaise,
  progressPercent,
  onPreview,
  onSelect,
  className
}) => {
  const isPoster = aspectRatio === '2:3';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-[#1A373E] bg-[#0E2024] transition-all duration-300 hover:border-amber-500/50 hover:shadow-lift hover:-translate-y-1.5 cursor-pointer select-none',
        isPoster ? 'w-48 sm:w-56' : 'w-64 sm:w-72',
        className
      )}
    >
      {/* Visual Cover Container */}
      <div className={cn('relative w-full overflow-hidden bg-[#040C0E]', isPoster ? 'aspect-[2/3]' : 'aspect-[16/9]')}>
        {imageId || coverImage ? (
          <Img
            id={imageId}
            src={coverImage}
            alt={title}
            aspectRatio={isPoster ? '2/3' : '16/9'}
            fallbackTitle={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#081619] via-[#0E2024] to-[#152B30] p-4 text-center">
            <span className="font-serif text-2xl font-bold text-amber-500/80 mb-2">AB</span>
            <p className="font-serif text-xs font-semibold text-white/90 line-clamp-2">{title}</p>
          </div>
        )}

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E2024] via-transparent to-transparent opacity-80" />

        {/* Peterson Academy Trending Rank Badge */}
        {typeof rankNumber === 'number' && (
          <div className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#F5871F] to-[#E0760E] font-serif text-base font-bold text-black shadow-lg">
            {rankNumber}
          </div>
        )}

        {/* Floating Preview Action on Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.();
            }}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-black shadow-lg transition-transform hover:scale-105"
          >
            <Play className="h-3 w-3 fill-current" /> Preview
          </button>
        </div>

        {/* Lesson Count Pill */}
        {typeof lessonCount === 'number' && (
          <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {lessonCount} Lessons
          </div>
        )}
      </div>

      {/* Card Metadata */}
      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2">
        <div>
          {category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              {category}
            </span>
          )}
          <h4 className="font-serif text-sm font-semibold text-[#F8FAFA] line-clamp-2 group-hover:text-amber-400 transition-colors">
            {title}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#1A373E]/60 text-xs">
          {typeof progressPercent === 'number' ? (
            <div className="flex items-center gap-2">
              <ProgressRing progress={progressPercent} size={28} strokeWidth={2.5} />
              <span className="text-[11px] text-[#8D9FA4]">{progressPercent}% complete</span>
            </div>
          ) : typeof pricePaise === 'number' ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-white">{formatPaise(pricePaise)}</span>
              {compareAtPricePaise && (
                <span className="text-[10px] text-[#8D9FA4] line-through">
                  {formatPaise(compareAtPricePaise)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-amber-400 font-medium">Free Access</span>
          )}

          <span className="text-[11px] font-medium text-[#8D9FA4] group-hover:text-white transition-colors">
            Details &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};

export default PosterCard;

