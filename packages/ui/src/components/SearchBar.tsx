import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search challenges, courses, frameworks and topics...',
  className
}) => {
  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D9FA4]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-[#1A373E] bg-[#0E2024] pl-10 pr-9 text-xs text-[#F8FAFA] placeholder-[#8D9FA4]/60 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D9FA4] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

