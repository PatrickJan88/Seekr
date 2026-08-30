"use client";

import * as React from "react";
import {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  CommandMenuEmpty,
  useCommandMenuShortcut,
} from "./ui/command-menu";
import { Kbd } from "./ui/kbd";
import { Search, Building, Briefcase } from "lucide-react";
import { JobApplication } from "../types";

// Utility function to detect OS and return appropriate modifier key
const getModifierKey = () => {
  if (typeof navigator === "undefined") return { key: "Ctrl", symbol: "Ctrl" };
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
               navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  return isMac
    ? { key: "cmd", symbol: "⌘" }
    : { key: "ctrl", symbol: "Ctrl" };
};

interface CommandSearchProps {
  applications: JobApplication[];
  onSelectApplication: (app: JobApplication) => void;
}

export function CommandSearch({ applications, onSelectApplication }: CommandSearchProps) {
  const [open, setOpen] = React.useState(false);
  
  useCommandMenuShortcut(() => setOpen(true));

  return (
    <CommandMenu open={open} onOpenChange={setOpen}>
      <CommandMenuTrigger asChild>
        <button className="hidden sm:flex items-center gap-2 h-10 bg-white hover:bg-[#faf9f7] border border-[#efefef] text-[#777c86] hover:text-[#121722] px-3 rounded-full transition-all cursor-pointer shadow-2xs">
          <Search size={16} className="shrink-0" />
          <div className="flex items-center gap-1 opacity-70 shrink-0">
            <Kbd size="xs">{getModifierKey().symbol}</Kbd>
            <Kbd size="xs">K</Kbd>
          </div>
        </button>
      </CommandMenuTrigger>
      
      <CommandMenuContent>
        {/* We need to pass down the typed query or lift state up, but CommandMenuInput uses context. We can't access context directly here without creating a wrapper or hooking into the input. 
            Alternatively, we can create a custom input wrapper to sync state, or let the CommandMenu handle the raw string but wait, the CommandMenu Provider handles `value`.
            We can make a component that sits inside CommandMenuContent that consumes the context. */}
        <CommandSearchBody 
          applications={applications} 
          onSelect={(app) => {
            onSelectApplication(app);
            setOpen(false);
          }} 
        />
      </CommandMenuContent>
    </CommandMenu>
  );
}

// Inner component to access the context
import { useCommandMenu } from "./ui/command-menu";

function CommandSearchBody({ applications, onSelect }: { applications: JobApplication[], onSelect: (app: JobApplication) => void }) {
  const { value, setValue } = useCommandMenu();

  React.useEffect(() => {
    setValue("");
  }, [setValue]);

  const query = value.toLowerCase();
  
  const { positions, companies } = React.useMemo(() => {
    if (!query) {
      // Return recent applications if no query
      return { 
        positions: applications.slice(0, 5), 
        companies: [] 
      };
    }
    
    const scoreMatch = (text: string | undefined, q: string) => {
      if (!text) return 0;
      const lowerText = text.toLowerCase();
      if (lowerText === q) return 4;
      if (lowerText.startsWith(q)) return 3;
      if (lowerText.includes(` ${q}`)) return 2;
      if (lowerText.includes(q)) return 1;
      return 0;
    };

    const positionsWithScores = applications
      .map(app => ({ app, score: scoreMatch(app.position, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.app.position || '').localeCompare(b.app.position || ''))
      .map(item => item.app)
      .slice(0, 10);

    const positionIds = new Set(positionsWithScores.map(p => p.id));
    
    const companiesWithScores = applications
      .filter(app => !positionIds.has(app.id))
      .map(app => ({ app, score: scoreMatch(app.company, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.app.company || '').localeCompare(b.app.company || ''))
      .map(item => item.app)
      .slice(0, 10);
      
    return { positions: positionsWithScores, companies: companiesWithScores };
  }, [applications, query]);

  let currentIndex = 0;
  const hasResults = positions.length > 0 || companies.length > 0;

  return (
    <>
      <CommandMenuInput placeholder="Search positions, companies..." />
      <CommandMenuList>
        {!hasResults && (
          <CommandMenuEmpty>No search results</CommandMenuEmpty>
        )}
        
        {positions.length > 0 && (
          <CommandMenuGroup heading={query ? "Positions" : "Recent Applications"}>
            {positions.map((app) => {
              const idx = currentIndex++;
              return (
                <CommandMenuItem 
                  key={app.id} 
                  index={idx}
                  icon={<Briefcase />}
                  onSelect={() => onSelect(app)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{app.position}</span>
                    <span className="text-xs text-[#777c86]">{app.company} {app.status ? `• ${app.status}` : ''}</span>
                  </div>
                </CommandMenuItem>
              );
            })}
          </CommandMenuGroup>
        )}
        
        {companies.length > 0 && (
          <>
            <CommandMenuSeparator />
            <CommandMenuGroup heading="Companies">
              {companies.map((app) => {
                const idx = currentIndex++;
                return (
                  <CommandMenuItem 
                    key={app.id} 
                    index={idx}
                    icon={<Building />}
                    onSelect={() => onSelect(app)}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{app.company}</span>
                      <span className="text-xs text-[#777c86]">{app.position} {app.status ? `• ${app.status}` : ''}</span>
                    </div>
                  </CommandMenuItem>
                );
              })}
            </CommandMenuGroup>
          </>
        )}
      </CommandMenuList>
    </>
  );
}
