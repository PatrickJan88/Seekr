import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showSearch?: boolean;
  menuMaxHeight?: string;
  className?: string;
  icon?: React.ReactNode;
  id?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search or type letter...',
  disabled = false,
  clearable = true,
  showSearch,
  menuMaxHeight,
  className = '',
  icon,
  id
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchVisible = showSearch ?? options.length > 5;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const [calculatedMaxHeight, setCalculatedMaxHeight] = useState<string | undefined>(menuMaxHeight);

  // Focus search input when dropdown opens & calculate responsive max height with 24px bottom margin
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      const calculateResponsiveHeight = () => {
        if (menuMaxHeight) {
          setCalculatedMaxHeight(menuMaxHeight);
          return;
        }

        if (!containerRef.current) return;

        const triggerRect = containerRef.current.getBoundingClientRect();
        const scrollParent = containerRef.current.closest('.overflow-y-auto') || containerRef.current.closest('.flex-grow');
        
        let bottomBoundary = window.innerHeight;
        if (scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          bottomBoundary = parentRect.bottom;
        }

        // Available vertical height ensuring at least 16px (1rem) margin above bottom boundary
        const availableSpace = bottomBoundary - triggerRect.bottom - 16 - 6; // 6px for mt-1.5
        const boundedSpace = Math.max(140, Math.min(320, availableSpace));
        setCalculatedMaxHeight(`${Math.floor(boundedSpace)}px`);
      };

      calculateResponsiveHeight();
      window.addEventListener('resize', calculateResponsiveHeight);
      return () => window.removeEventListener('resize', calculateResponsiveHeight);
    }
  }, [isOpen, menuMaxHeight]);

  const selectedOption = useMemo(() => {
    return options.find(o => o.value === value);
  }, [options, value]);

  // Real-time filter supporting first-letter quick jump & substring match
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;

    // Prioritize options starting with the search query (e.g. typing 's' shows Sweden first)
    const startsWithMatches: SearchableSelectOption[] = [];
    const containsMatches: SearchableSelectOption[] = [];

    for (const opt of options) {
      const labelLower = opt.label.toLowerCase();
      if (labelLower.startsWith(q)) {
        startsWithMatches.push(opt);
      } else if (labelLower.includes(q) || (opt.sublabel && opt.sublabel.toLowerCase().includes(q))) {
        containsMatches.push(opt);
      }
    }

    return [...startsWithMatches, ...containsMatches];
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Keyboard navigation & single-letter jump on trigger button
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // First letter quick jump directly from closed trigger
      setIsOpen(true);
      setSearchQuery(e.key);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full flex items-center justify-between pl-3.5 pr-3 py-2 border border-[#efefef] rounded-2xl bg-[#faf9f7] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-xs text-[#121722] text-left ${
          disabled ? 'opacity-50 cursor-not-allowed bg-[#faf9f7]' : 'cursor-pointer hover:border-slate-300'
        } ${isOpen ? 'border-[#0068f9] ring-1 ring-[#0068f9]' : ''}`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {icon && <span className="text-[#777c86] shrink-0">{icon}</span>}
          <span className={`truncate ${selectedOption ? 'text-[#121722] font-medium' : 'text-[#a5a5a5]'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && value !== 'none' && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('');
                  setSearchQuery('');
                }
              }}
              className="p-0.5 text-[#a5a5a5] hover:text-[#121722] hover:bg-[#eaeaea] rounded-full transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={`text-[#777c86] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#efefef] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col"
          style={{ maxHeight: calculatedMaxHeight || menuMaxHeight || '33.33vh' }}
        >
          {/* Search Box Header */}
          {isSearchVisible && (
            <div className="p-2 border-b border-[#f1f3f5] bg-white shrink-0">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-[#a5a5a5] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-7 py-1.5 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none text-[#121722] placeholder:text-[#a5a5a5]"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsOpen(false);
                    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                      e.preventDefault();
                      handleSelect(filteredOptions[0].value);
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-0.5 text-[#a5a5a5] hover:text-[#121722] rounded-full"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List with 1/3 viewport height guardrail */}
          <div 
            ref={listRef}
            className="flex-1 overflow-y-auto p-1 divide-y divide-transparent custom-scrollbar space-y-0.5"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#a5a5a5]">
                No matching locations
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8f1ff] text-[#0068f9] font-semibold'
                        : 'text-[#121722] hover:bg-[#faf9f7]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="truncate block">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-[#777c86] block truncate">{opt.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check size={13} className="text-[#0068f9] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
