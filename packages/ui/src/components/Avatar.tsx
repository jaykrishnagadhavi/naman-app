import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@abrainoconscious/shared';

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  alt?: string;
  fallbackText?: string;
}

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, src, alt, fallbackText = 'AB', ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#1A373E] bg-[#0E2024]',
      className
    )}
    {...props}
  >
    <AvatarPrimitive.Image
      src={src}
      alt={alt}
      className="aspect-square h-full w-full object-cover"
    />
    <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-[#152B30] text-xs font-semibold text-[#F5871F]">
      {fallbackText}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

