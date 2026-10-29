import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

const __TRANSITION_STYLES = `
:root {
  --dropdown-open-dur: 250ms;
  --dropdown-close-dur: 150ms;
  --dropdown-pre-scale: 0.97;
  --dropdown-closing-scale: 0.99;
  --dropdown-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.t-dropdown {
  transform-origin: top left;
  transform: scale(var(--dropdown-pre-scale));
  opacity: 0;
  pointer-events: none;
  transition:
    transform var(--dropdown-open-dur) var(--dropdown-ease),
    opacity   var(--dropdown-open-dur) var(--dropdown-ease);
  will-change: transform, opacity;
}
.t-dropdown[data-origin="top-right"]     { transform-origin: top right; }
.t-dropdown[data-origin="top-center"]    { transform-origin: top center; }
.t-dropdown[data-origin="bottom-left"]   { transform-origin: bottom left; }
.t-dropdown[data-origin="bottom-center"] { transform-origin: bottom center; }
.t-dropdown[data-origin="bottom-right"]  { transform-origin: bottom right; }

.t-dropdown.is-open {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.t-dropdown.is-closing {
  transform: scale(var(--dropdown-closing-scale));
  opacity: 0;
  pointer-events: none;
  transition:
    transform var(--dropdown-close-dur) var(--dropdown-ease),
    opacity   var(--dropdown-close-dur) var(--dropdown-ease);
}

@media (prefers-reduced-motion: reduce) {
  .t-dropdown { transition: none !important; }
}
`;

if (typeof document !== "undefined" && !document.getElementById("transitions-p2")) {
  const __style = document.createElement("style");
  __style.id = "transitions-p2";
  __style.textContent = __TRANSITION_STYLES;
  document.head.appendChild(__style);
}

function readMs(name: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  labelPrefix?: string;
  isActive?: boolean;
  activeClassName?: string;
  onClear?: (e: React.MouseEvent) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Dropdown({ 
  options, 
  value, 
  onChange, 
  icon, 
  labelPrefix, 
  isActive, 
  activeClassName, 
  onClear,
  searchable,
  searchPlaceholder = "Search..."
}: DropdownProps) {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSearchEnabled = searchable ?? options.length > 7;

  useEffect(() => {
    if (state !== "closing") return;
    const ms = readMs("--dropdown-close-dur", 200);
    const id = window.setTimeout(() => setState("closed"), ms);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (state === "open" && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setState("closing");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state]);

  useEffect(() => {
    if (state === "open") {
      setSearchQuery("");
      if (isSearchEnabled) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    }
  }, [state, isSearchEnabled]);

  const toggle = () => setState((s) => (s === "open" ? "closing" : "open"));

  const selectedOption = options.find(o => o.value === value) || options[0];

  // Quick filtering with letter-jump prioritization
  const filteredOptions = React.useMemo(() => {
    if (!isSearchEnabled || !searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();

    const startsWith: DropdownOption[] = [];
    const contains: DropdownOption[] = [];

    for (const opt of options) {
      const l = opt.label.toLowerCase();
      if (l.startsWith(q)) {
        startsWith.push(opt);
      } else if (l.includes(q)) {
        contains.push(opt);
      }
    }
    return [...startsWith, ...contains];
  }, [options, searchQuery, isSearchEnabled]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button" 
        onClick={toggle}
        className={`flex items-center gap-2 rounded-full px-4 shadow-2xs transition-colors h-[38px] cursor-pointer ${isActive && activeClassName ? activeClassName : 'bg-white border border-[#efefef] hover:bg-[#faf9f7]'}`}
      >
        {icon && <span className={isActive ? "" : "text-[#777c86]"}>{icon}</span>}
        <span className={`text-sm font-medium whitespace-nowrap ${isActive ? "" : "text-[#121722]"}`}>
          {labelPrefix && <span className={isActive ? "" : "text-[#777c86] font-normal mr-1"}>{labelPrefix}</span>}
          {selectedOption?.label}
        </span>
        {isActive && onClear ? (
          <div 
            onClick={(e) => { e.stopPropagation(); onClear(e); }}
            className="hover:bg-black/10 rounded-full p-0.5 -mr-1 transition-colors"
          >
            <X size={14} />
          </div>
        ) : (
          <ChevronDown size={14} className={isActive ? "" : "text-[#777c86]"} />
        )}
      </button>

      {(state === "open" || state === "closing") && (
        <div
          role="menu"
          data-origin="top-center"
          className={
            "t-dropdown absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[170px] max-w-[260px] bg-white border border-[#efefef] rounded-2xl shadow-xl p-1 z-50 flex flex-col overflow-hidden" +
            (state === "open" ? " is-open" : "") +
            (state === "closing" ? " is-closing" : "")
          }
          style={{ maxHeight: '33.33vh' }}
        >
          {isSearchEnabled && (
            <div className="p-1.5 border-b border-[#f1f3f5] bg-white shrink-0">
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2 text-[#a5a5a5] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-6 pr-6 py-1 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none text-[#121722] placeholder:text-[#a5a5a5]"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setState("closing");
                    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                      e.preventDefault();
                      onChange(filteredOptions[0].value);
                      setState("closing");
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1.5 p-0.5 text-[#a5a5a5] hover:text-[#121722] rounded-full"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-0.5 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-[#a5a5a5]">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onChange(opt.value);
                    setState("closing");
                  }}
                  className={`w-full flex items-center justify-between text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    value === opt.value
                      ? 'bg-[#e8f1ff] text-[#0068f9] font-semibold'
                      : 'text-[#121722] hover:bg-[#faf9f7]'
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {value === opt.value && <Check size={13} className="text-[#0068f9] shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
