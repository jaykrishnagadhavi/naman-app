import React from 'react';
import { LucideIcon, ArrowRight, Construction } from 'lucide-react';
import { Button } from './Button';

export interface ComingSoonPlaceholderProps {
  stepNumber: number;
  stepName: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  onNavigateToPrograms?: () => void;
}

export const ComingSoonPlaceholder: React.FC<ComingSoonPlaceholderProps> = ({
  stepNumber,
  stepName,
  title,
  description,
  icon: Icon = Construction,
  onNavigateToPrograms,
}) => {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg w-full space-y-6 rounded-2xl border border-[#1A373E] bg-[#081619] p-8 sm:p-10 shadow-2xl">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Icon className="h-8 w-8 text-amber-400" />
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow">
            {stepNumber}
          </span>
        </div>

        <div className="space-y-2">
          <div className="inline-block rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Step {stepNumber}: {stepName}
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-[#8D9FA4] leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {onNavigateToPrograms && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToPrograms}
              className="inline-flex items-center gap-2 text-xs"
            >
              <span>Manage Programs (Step 4)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

