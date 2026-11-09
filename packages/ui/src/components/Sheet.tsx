import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

const sheetSideVariants: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 border-b border-[var(--color-border,#1A373E)] max-h-[90dvh]',
  bottom: 'inset-x-0 bottom-0 border-t border-[var(--color-border,#1A373E)] max-h-[90dvh] rounded-t-2xl',
  left: 'inset-y-0 left-0 h-full w-full max-w-sm sm:max-w-md border-r border-[var(--color-border,#1A373E)]',
  right: 'inset-y-0 right-0 h-full w-full max-w-sm sm:max-w-md border-l border-[var(--color-border,#1A373E)]',
};

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide;
  showCloseButton?: boolean;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = 'right', showCloseButton = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden bg-[var(--color-surface-1,#081619)] text-[var(--color-text-body,#E1E8EA)] shadow-2xl transition-all duration-300',
        sheetSideVariants[side],
        '[&>form]:flex [&>form]:flex-col [&>form]:flex-1 [&>form]:min-h-0 [&>form]:overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 z-20 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-[var(--color-text-muted,#8D9FA4)] hover:text-[var(--color-text-title,#F8FAFA)]"
          aria-label="Close sheet"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col space-y-1.5 p-5 sm:p-6 pb-4 border-b border-[var(--color-border,#1A373E)]/60 text-left pr-12',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-serif text-lg sm:text-xl font-semibold leading-none text-[var(--color-text-title,#F8FAFA)]', className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-xs text-[var(--color-text-muted,#8D9FA4)]', className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export const SheetBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain',
      className
    )}
    {...props}
  />
));
SheetBody.displayName = 'SheetBody';

export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[var(--color-border,#1A373E)]/60 bg-[var(--color-surface-1,#081619)] sticky bottom-0 z-10',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

