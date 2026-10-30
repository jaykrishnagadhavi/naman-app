import React from 'react';
import { cn } from '@abrainoconscious/shared';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-[#E1E8EA]">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-sm text-[#F8FAFA] placeholder-[#8D9FA4]/50 transition-colors focus:border-[#F5871F] focus:outline-none focus:ring-1 focus:ring-[#F5871F]/40 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-[#E1E8EA]">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-sm text-[#F8FAFA] placeholder-[#8D9FA4]/50 transition-colors focus:border-[#F5871F] focus:outline-none focus:ring-1 focus:ring-[#F5871F]/40 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

