import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Clock, Check } from "lucide-react";

interface DateFilterMenuProps {
  dateFilter: string;
  onSelectDate: (dateValue: string) => void;
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
}: DateFilterMenuProps) {
  const getDisplayText = () => {
    if (!dateFilter) return "Date Posted";
    const found = DATE_OPTIONS.find(o => o.value === dateFilter);
    return found ? found.label : "Date Posted";
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center w-full sm:w-48 h-11 bg-white border border-[#efefef] rounded-full text-sm px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#faf9f7] transition-all cursor-pointer">
          <Clock className="text-[#a5a5a5] mr-2 shrink-0" size={16} />
          <span className="text-[#121722] truncate flex-1 text-left">{getDisplayText()}</span>
          <div className="text-[#a5a5a5] shrink-0 ml-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="z-[100] min-w-[200px] bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95"
          sideOffset={8}
        >
          <DropdownMenu.Item 
            className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
            onClick={() => onSelectDate("")}
          >
            Any time
            {!dateFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />
          
          {DATE_OPTIONS.map(option => (
            <DropdownMenu.Item 
              key={option.value}
              className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
              onClick={() => onSelectDate(option.value)}
            >
              {option.label}
              {dateFilter === option.value && <Check size={16} className="ml-auto text-[#0068f9]" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
