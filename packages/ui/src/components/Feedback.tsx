import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, Inbox } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

// Tooltip
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-[#1A373E] bg-[#0E2024] px-3 py-1.5 text-xs text-[#E1E8EA] shadow-md animate-fade-in',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ content, children }) => (
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
);

// Skeleton
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('animate-pulse rounded-md bg-[#0E2024]/80', className)} {...props} />
);

// EmptyState
export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className
}) => (
  <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#1A373E] bg-[#081619]', className)}>
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0E2024] text-[#8D9FA4] mb-3">
      {icon || <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="font-serif text-base font-semibold text-[#F8FAFA]">{title}</h3>
    <p className="mt-1 max-w-sm text-xs text-[#8D9FA4]">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Accordion (Radix)
export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-[#1A373E]', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 text-sm font-medium text-[#F8FAFA] transition-all hover:text-[#F5871F] [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-[#8D9FA4]" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-xs text-[#8D9FA4] transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down pb-4',
      className
    )}
    {...props}
  >
    {children}
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// Toast Notification Widget
export interface ToastNotificationProps {
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastNotificationProps> = ({
  title,
  description,
  type = 'info',
  onClose,
  className
}) => {
  const borderColors = {
    success: 'border-[#00A884]',
    info: 'border-[#F5871F]',
    warning: 'border-yellow-500',
    error: 'border-red-500'
  };

  return (
    <div className={cn('flex items-start justify-between gap-3 rounded-lg border bg-[#0E2024] p-3 shadow-xl text-white max-w-sm', borderColors[type], className)}>
      <div className="space-y-0.5">
        <h4 className="text-xs font-semibold text-white">{title}</h4>
        {description && <p className="text-[11px] text-[#8D9FA4]">{description}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="text-[#8D9FA4] hover:text-white text-xs">
          ✕
        </button>
      )}
    </div>
  );
};

