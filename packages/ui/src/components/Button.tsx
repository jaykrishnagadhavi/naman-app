import React from 'react';
import { cn } from '@abrainoconscious/shared';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cta' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary: 'bg-[#F5871F] text-black hover:bg-[#FF9E3B] active:bg-[#D9730D] shadow-md font-semibold',
      cta: 'bg-gradient-to-r from-[#F5871F] to-[#E0760E] text-black hover:brightness-110 active:brightness-95 shadow-glow font-bold tracking-wide uppercase',
      secondary: 'bg-[#0E2024] text-[#E1E8EA] hover:bg-[#152B30] hover:text-white border border-[#1A373E]',
      ghost: 'bg-transparent text-[#E1E8EA] hover:bg-[#0E2024] hover:text-white',
      outline: 'bg-transparent text-[#E1E8EA] hover:bg-[#0E2024] border border-[#1A373E] hover:border-amber-500/50',
      danger: 'bg-red-600/90 text-white hover:bg-red-500 shadow-sm'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      xl: 'h-14 px-8 text-lg rounded-xl gap-3 font-semibold'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

