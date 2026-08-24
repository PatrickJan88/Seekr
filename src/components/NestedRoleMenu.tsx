import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Briefcase, ChevronRight, Check } from "lucide-react";

interface RoleOption {
  label: string;
  value: string;
}

interface NestedRoleMenuProps {
  roleCategories: Record<string, RoleOption[]>;
  typeFilter: string;
  onSelectType: (typeValue: string) => void;
}

export function NestedRoleMenu({
  roleCategories,
  typeFilter,
  onSelectType,
}: NestedRoleMenuProps) {
  const getDisplayText = () => {
    if (!typeFilter) return "All Roles";
    for (const cat of Object.values(roleCategories)) {
      const found = cat.find(r => r.value === typeFilter);
      if (found) return found.label;
    }
    return "All Roles";
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center w-full sm:w-64 h-11 bg-white border border-[#efefef] rounded-full text-sm px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#faf9f7] transition-all cursor-pointer">
          <Briefcase className="text-[#a5a5a5] mr-2 shrink-0" size={16} />
          <span className="text-[#121722] truncate flex-1 text-left">{getDisplayText()}</span>
          <div className="text-[#a5a5a5] shrink-0 ml-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="z-[100] min-w-[260px] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95"
          sideOffset={8}
        >
          <DropdownMenu.Item 
            className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
            onClick={() => onSelectType("")}
          >
            All Roles
            {!typeFilter && <Check size={16} className="ml-auto text-[#0068f9]" />}
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />

          {Object.entries(roleCategories).map(([category, roles]) => {
            const hasActiveRole = roles.some(r => r.value === typeFilter);

            return (
              <DropdownMenu.Sub key={category}>
                <DropdownMenu.SubTrigger className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7]">
                  {category}
                  {hasActiveRole && <Check size={16} className="ml-auto text-[#0068f9] mr-2" />}
                  <ChevronRight size={16} className="ml-auto text-[#a5a5a5]" />
                </DropdownMenu.SubTrigger>
                
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent 
                    className="z-[100] min-w-[260px] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95"
                    sideOffset={4}
                  >
                    {roles.map(role => (
                      <DropdownMenu.Item 
                        key={role.value}
                        className="flex items-center px-3 py-2 text-sm text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                        onClick={() => onSelectType(role.value)}
                      >
                        {role.label}
                        {typeFilter === role.value && <Check size={16} className="ml-auto text-[#0068f9]" />}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
