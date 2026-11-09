import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = React.forwardRef<
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
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '4xl': 'sm:max-w-4xl',
  full: 'sm:max-w-[calc(100vw-2rem)]',
};

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  showCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = 'lg', showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base positioning & dimensions
        'fixed z-50 flex flex-col overflow-hidden w-full max-h-[90dvh] h-fit',
        // Mobile layout: bottom sheet attached to bottom with rounded top corners
        'inset-x-0 bottom-0 top-auto rounded-t-2xl rounded-b-none border-t border-[var(--color-border,#1A373E)]',
        // Tablet & Desktop layout: perfectly centered via inset-0 + margin:auto (transform-free, immune to animation clobbering)
        'sm:inset-0 sm:m-auto sm:rounded-2xl sm:border border-[var(--color-border,#1A373E)]',
        // Sizing
        dialogSizeClasses[size],
        // Theming & surface colors
        'bg-[var(--color-surface-1,#081619)] text-[var(--color-text-body,#E1E8EA)] shadow-2xl animate-fade-in',
        // Ensure child forms propagate flex column for scrolling body
        '[&>form]:flex [&>form]:flex-col [&>form]:flex-1 [&>form]:min-h-0 [&>form]:overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 z-20 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-[var(--color-text-muted,#8D9FA4)] hover:text-[var(--color-text-title,#F8FAFA)]"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-dialog-header="true"
    className={cn(
      'flex shrink-0 flex-col space-y-1.5 p-5 sm:p-6 pb-4 border-b border-[var(--color-border,#1A373E)]/60 text-left pr-12',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-serif text-lg sm:text-xl font-semibold leading-none text-[var(--color-text-title,#F8FAFA)]', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-xs text-[var(--color-text-muted,#8D9FA4)]', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export const DialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-dialog-body="true"
    className={cn(
      'flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain',
      className
    )}
    {...props}
  />
));
DialogBody.displayName = 'DialogBody';

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-dialog-footer="true"
    className={cn(
      'flex shrink-0 flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[var(--color-border,#1A373E)]/60 bg-[var(--color-surface-1,#081619)] sticky bottom-0 z-10',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';
