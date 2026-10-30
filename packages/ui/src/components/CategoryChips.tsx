import React from 'react';
import { HeartHandshake, Brain, GraduationCap, Sparkles, Layers } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export interface CategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  className
}) => {
  const categories = [
    { id: 'all', label: 'All Programs', icon: Layers },
    { id: 'emotional', label: 'Emotional Resilience', icon: HeartHandshake },
    { id: 'mental', label: 'Mental Clarity', icon: Brain },
    { id: 'academic', label: 'Academic Mastery', icon: GraduationCap },
    { id: 'personal', label: 'Personal Momentum', icon: Sparkles }
  ];

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none', className)}>
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 select-none border',
              isSelected
                ? 'bg-[#F5871F] text-black font-semibold border-[#F5871F] shadow-glow'
                : 'bg-[#0E2024] text-[#8D9FA4] border-[#1A373E] hover:border-amber-500/40 hover:text-white'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-black' : 'text-amber-400')} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryChips;

