import React, { useState, useMemo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Briefcase, ChevronRight, Check, Search, ChevronDown } from "lucide-react";
import { JobApplication, JobStatus } from "../types";

interface NestedApplicationMenuProps {
  applications: JobApplication[];
  selectedAppId: string;
  onSelectApplication: (id: string) => void;
}

export function NestedApplicationMenu({
  applications,
  selectedAppId,
  onSelectApplication,
}: NestedApplicationMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const selectedApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId);
  }, [applications, selectedAppId]);

  const categories = useMemo(() => {
    const groups: Record<string, JobApplication[]> = {};
    applications.forEach((app) => {
      const status = app.status || "Unknown";
      if (!groups[status]) groups[status] = [];
      groups[status].push(app);
    });
    return groups;
  }, [applications]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = searchTerm.toLowerCase();
    return applications.filter(
      (app) =>
        app.position?.toLowerCase().includes(query) ||
        app.company?.toLowerCase().includes(query)
    ).slice(0, 50); // limit for performance
  }, [applications, searchTerm]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center w-full h-10 bg-white border border-[#efefef] rounded-2xl text-xs px-3.5 focus:outline-none focus:ring-1 focus:ring-[#0068f9] shadow-sm hover:bg-[#faf9f7] transition-all cursor-pointer font-medium">
          <Briefcase className="text-[#a5a5a5] mr-2 shrink-0" size={14} />
          <span className="text-[#121722] truncate flex-1 text-left">
            {selectedApp
              ? `${selectedApp.position} at ${selectedApp.company}`
              : "-- Choose a tracked application --"}
          </span>
          <div className="text-[#a5a5a5] shrink-0 ml-2">
            <ChevronDown size={14} />
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[100] min-w-[280px] w-[var(--radix-dropdown-menu-trigger-width)] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95 custom-scrollbar"
          sideOffset={8}
        >
          <div className="p-2 sticky top-0 bg-white z-10 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={14} />
              <input
                type="text"
                placeholder="Search position or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} // Prevent spacebar from closing menu
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf9f7] border border-[#efefef] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0068f9] transition-all text-[#121722]"
              />
            </div>
          </div>

          <DropdownMenu.Item
            className="flex items-center px-3 py-2 text-xs text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none mt-1"
            onClick={() => onSelectApplication("")}
          >
            -- Clear Selection --
            {!selectedAppId && <Check size={14} className="ml-auto text-[#0068f9]" />}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />

          {searchTerm.trim() ? (
            // Search Results
            searchResults.length > 0 ? (
              searchResults.map((app) => (
                <DropdownMenu.Item
                  key={app.id}
                  className="flex flex-col px-3 py-2 rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                  onClick={() => onSelectApplication(app.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-[#121722] truncate">
                      {app.position}
                    </span>
                    {selectedAppId === app.id && <Check size={14} className="text-[#0068f9] shrink-0 ml-2" />}
                  </div>
                  <span className="text-[10px] text-[#777c86] truncate">
                    {app.company} • {app.status}
                  </span>
                </DropdownMenu.Item>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-[#777c86]">
                No applications found
              </div>
            )
          ) : (
            // Nested Categories
            Object.entries(categories).map(([status, apps]: [string, JobApplication[]]) => {
              const hasActiveApp = apps.some((a) => a.id === selectedAppId);
              return (
                <DropdownMenu.Sub key={status}>
                  <DropdownMenu.SubTrigger className="flex items-center px-3 py-2 text-xs text-[#121722] rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7]">
                    {status}
                    <span className="ml-2 text-[10px] text-[#a5a5a5] px-1.5 py-0.5 bg-[#efefef] rounded-full">
                      {apps.length}
                    </span>
                    {hasActiveApp && <Check size={14} className="ml-auto text-[#0068f9] mr-2" />}
                    <ChevronRight size={14} className="ml-auto text-[#a5a5a5]" />
                  </DropdownMenu.SubTrigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent
                      className="z-[100] min-w-[260px] max-w-[320px] max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-[#efefef] shadow-lg p-1 animate-in fade-in-80 zoom-in-95 custom-scrollbar"
                      sideOffset={4}
                    >
                      {apps.map((app) => (
                        <DropdownMenu.Item
                          key={app.id}
                          className="flex flex-col px-3 py-2 rounded-lg cursor-pointer hover:bg-[#faf9f7] outline-none select-none"
                          onClick={() => onSelectApplication(app.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-[#121722] truncate pr-2">
                              {app.position}
                            </span>
                            {selectedAppId === app.id && <Check size={14} className="text-[#0068f9] shrink-0" />}
                          </div>
                          <span className="text-[10px] text-[#777c86] truncate">
                            {app.company}
                          </span>
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              );
            })
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
