import React, { useState, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Clock, Check } from "lucide-react";
import { cn, computeDropdownAlign, DropdownAlign } from "../lib/utils";

interface DateFilterMenuProps {
  dateFilter: string;
  onSelectDate: (dateValue: string) => void;
  className?: string;
}

const DATE_OPTIONS = [
  { label: "Past 24 hours", value: "24h" },
  { label: "Past week", value: "7d" },
  { label: "Past 15 days", value: "15d" },
  { label: "Past month", value: "30d" },
];

export function DateFilterMenu({
  dateFilter,
  onSelectDate,
  className,
}: DateFilterMenuProps) {
  const [menuAlign, setMenuAlign] = useState<DropdownAlign>("start");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const getDisplayText = () => {
    if (!dateFilter) return "Date Posted";
    const found = DATE_OPTIONS.find(o => o.value === dateFilter);
    return found ? found.label : "Date Posted";
  };

  return (
    <DropdownMenu.Root onOpenChange={(open) => {
      if (open) {
        setMenuAlign(computeDropdownAlign(triggerRef.current, 200));
      }
    }}>
      <DropdownMenu.Trigger asChild>
        <button ref={triggerRef} className={cn("flex items-center w-full sm:w-auto min-w-0 sm:min-w-[110px] sm:max-w-[150px] xl:max-w-[170px] h-[38px] bg-[#faf9f7] border border-[#efefef] rounded-lg text-[13px] font-medium px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#f3f2ef] transition-all cursor-pointer", className)}>
          <Clock className="text-[#a5a5a5] mr-2 shrink-0" size={15} />
          <span className="text-[#121722] truncate flex-1 text-left">{getDisplayText()}</span>
          <div className="text-[#a5a5a5] shrink-0 ml-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          align={menuAlign}
          collisionPadding={16}
          className="z-[100] min-w-[200px] bg-white rounded-2xl border border-[#efefef] shadow-xl p-1.5 space-y-0.5 animate-in fade-in-80 zoom-in-95"
          sideOffset={8}
        >
          <DropdownMenu.Item 
            className="flex items-center px-3 py-1.5 text-[13px] text-[#121722] rounded-[10px] cursor-pointer hover:bg-[#faf9f7] outline-none select-none font-medium"
            onClick={() => onSelectDate("")}
          >
            Any time
            {!dateFilter && <Check size={14} className="ml-auto text-[#0068f9]" />}
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />
          
          {DATE_OPTIONS.map(option => (
            <DropdownMenu.Item 
              key={option.value}
              className="flex items-center px-3 py-1.5 text-[13px] text-[#121722] rounded-[10px] cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
              onClick={() => onSelectDate(option.value)}
            >
              {option.label}
              {dateFilter === option.value && <Check size={14} className="ml-auto text-[#0068f9]" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
