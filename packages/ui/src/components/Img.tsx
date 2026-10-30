import React, { useState, useEffect } from 'react';
import { cn } from '@abrainoconscious/shared';
import { IMAGES_INDEX, type ImageManifestEntry } from '../generated-images';

export interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string; // Required per spec
  src?: string;
  id?: string; // Key in IMAGES_INDEX (e.g. 'naman/naman-header', 'brand/logo')
  aspectRatio?: string | number; // e.g. '16/9', '2/3', 1.777
  priority?: boolean; // Eager for hero
  focalPoint?: string; // e.g. '50% 32%'
  sizes?: string;
  fallbackTitle?: string;
  containerClassName?: string;
}

export const Img: React.FC<ImgProps> = ({
  alt,
  src,
  id,
  aspectRatio,
  priority = false,
  focalPoint,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fallbackTitle,
  className,
  containerClassName,
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Look up manifest if id or relative src is provided
  const entryKey = id || (src ? src.replace(/^\/img\//, '').replace(/\.(avif|webp|jpe?g|png)$/, '').replace(/-\d+$/, '') : '');
  const entry: ImageManifestEntry | undefined = IMAGES_INDEX[entryKey];

  const resolvedFocalPoint = focalPoint || entry?.focalPoint || '50% 50%';
  const resolvedAspectRatio = aspectRatio || entry?.aspectRatio || '16/9';

  // Compute CSS aspect ratio
  const ratioStyle = typeof resolvedAspectRatio === 'number'
    ? { aspectRatio: `${resolvedAspectRatio}` }
    : typeof resolvedAspectRatio === 'string' && resolvedAspectRatio.includes('/')
    ? { aspectRatio: resolvedAspectRatio }
    : { aspectRatio: '16/9' };

  // Calculate srcsets if renditions exist
  const avifRenditions = entry?.renditions.filter(r => r.format === 'avif') || [];
  const webpRenditions = entry?.renditions.filter(r => r.format === 'webp') || [];

  const avifSrcSet = avifRenditions.map(r => `${r.src} ${r.width}w`).join(', ');
  const webpSrcSet = webpRenditions.map(r => `${r.src} ${r.width}w`).join(', ');

  const defaultSrc = src || (webpRenditions.length > 0 ? webpRenditions[webpRenditions.length - 1].src : '');

  // Reset states if src/id changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src, id]);

  if (hasError || (!defaultSrc && !entry)) {
    // Elegant gradient fallback as required by spec section 2 & 11
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#0A1D21] via-[#0E282E] to-[#163840] border border-[#1A373E] p-4 text-center select-none shadow-inner',
          containerClassName
        )}
        style={{ ...ratioStyle, ...style }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-60" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#183339] text-amber-500 shadow-md">
            <span className="font-serif text-lg font-bold">AB</span>
          </div>
          {fallbackTitle && (
            <p className="max-w-[80%] font-serif text-sm font-medium text-white/90 line-clamp-2">
              {fallbackTitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-[#0A171A]', containerClassName)}
      style={{ ...ratioStyle, ...style }}
    >
      {/* Tiny blur placeholder for zero layout jump */}
      {entry?.placeholder && !isLoaded && (
        <img
          src={entry.placeholder}
          aria-hidden="true"
          alt=""
          className="absolute inset-0 h-full w-full object-cover filter blur-lg scale-110 opacity-70 transition-opacity duration-300"
          style={{ objectPosition: resolvedFocalPoint }}
        />
      )}

      <picture>
        {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
        <img
          src={defaultSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          style={{ objectPosition: resolvedFocalPoint }}
          {...props}
        />
      </picture>
    </div>
  );
};

export default Img;

