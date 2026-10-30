import React from 'react';
import { cn } from '@abrainoconscious/shared';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'amber' | 'teal' | 'neutral' | 'outline' | 'paper';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'amber',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    amber: 'bg-[#F5871F]/15 text-[#F5871F] border border-[#F5871F]/30',
    teal: 'bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30',
    neutral: 'bg-[#152B30] text-[#8D9FA4] border border-[#1A373E]',
    outline: 'bg-transparent text-[#E1E8EA] border border-[#1A373E]',
    paper: 'bg-[#E5E1D5] text-[#142225] border border-[#D5D0C2]'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md'
  };

  return (
    <span
      className={cn('inline-flex items-center font-medium select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

