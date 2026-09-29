import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';

export type QSTier = 'all' | 'top50' | 'top100' | 'top250' | 'top500';

interface QSTierDropdownMenuProps {
  selectedTier: QSTier;
  onSelectTier: (tier: QSTier) => void;
  className?: string;
}

const TIER_OPTIONS: { label: string; value: QSTier }[] = [
  { label: 'All (1,422)', value: 'all' },
  { label: 'Top 50', value: 'top50' },
  { label: 'Top 100', value: 'top100' },
  { label: 'Top 250', value: 'top250' },
  { label: 'Top 500', value: 'top500' },
];

export function QSTierDropdownMenu({
  selectedTier,
  onSelectTier,
  className,
}: QSTierDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Trigger button label
  const getDisplayText = () => {
    if (selectedTier === 'top50') return 'QS: Top 50';
    if (selectedTier === 'top100') return 'QS: Top 100';
    if (selectedTier === 'top250') return 'QS: Top 250';
    if (selectedTier === 'top500') return 'QS: Top 500';
    return 'QS Tiers';
  };

  const isActive = selectedTier !== 'all';

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center w-full sm:w-auto min-w-0 sm:min-w-[110px] sm:max-w-[170px] xl:max-w-[190px] h-[38px] rounded-full text-sm font-medium px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs transition-all cursor-pointer select-none',
            isActive
              ? 'bg-blue-50/80 border border-[#0068f9]/40 text-[#0068f9] hover:bg-blue-50 font-semibold'
              : 'bg-white border border-[#efefef] text-[#121722] hover:bg-[#faf9f7]',
            className
          )}
          title={
            selectedTier !== 'all'
              ? `Filtered by QS ${selectedTier.toUpperCase()}`
              : 'Filter by QS World University Rank Tier'
          }
        >
          <GraduationCap
            className={cn('mr-2 shrink-0 transition-colors', isActive ? 'text-[#0068f9]' : 'text-[#a5a5a5]')}
            size={15}
          />
          <span className="truncate flex-1 text-left">{getDisplayText()}</span>
          <div className="text-[#a5a5a5] shrink-0 ml-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[100] w-[320px] sm:w-[360px] bg-white rounded-2xl border border-[#efefef] shadow-xl p-3 animate-in fade-in-80 zoom-in-95 outline-none select-none flex flex-col gap-2"
          sideOffset={8}
          align="start"
        >
          {/* Rank Tier Section - Exactly matching user screenshot */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-semibold text-[#777c86]">Rank Tier:</span>
              {selectedTier !== 'all' && (
                <button
                  type="button"
                  onClick={() => onSelectTier('all')}
                  className="text-[11px] font-semibold text-[#0068f9] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Tier Pills row matching Screenshot 1 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {TIER_OPTIONS.map((tier) => {
                const isSelected = selectedTier === tier.value;
                return (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => {
                      onSelectTier(tier.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border select-none',
                      isSelected
                        ? 'bg-[#0068f9] text-white border-[#0068f9] shadow-2xs font-semibold'
                        : 'bg-[#faf9f7] text-[#555a64] border-[#efefef] hover:bg-[#efefef] hover:text-[#121722]'
                    )}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
