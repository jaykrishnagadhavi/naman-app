import React from 'react';
import { cn } from '@abrainoconscious/shared';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'paper' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#0E2024] border border-[#1A373E] text-[#E1E8EA]',
      surface: 'bg-[#081619] border border-[#1A373E] text-[#E1E8EA]',
      paper: 'bg-[#EFECE1] border border-[#E0DBD0] text-[#142225] shadow-sm',
      interactive: 'bg-[#0E2024] border border-[#1A373E] text-[#E1E8EA] hover:border-[#F5871F]/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-ambient hover:shadow-lift'
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl p-5 shadow-ambient', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

