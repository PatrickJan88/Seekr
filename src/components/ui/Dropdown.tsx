import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { computeDropdownAlign, DropdownAlign } from "../../lib/utils";

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
  const [menuAlign, setMenuAlign] = useState<DropdownAlign>("start");
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
      const updateAlign = () => {
        setMenuAlign(computeDropdownAlign(containerRef.current, 220, { checkScrollParent: true }));
      };
      updateAlign();
      window.addEventListener("resize", updateAlign);
      if (isSearchEnabled) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
      return () => window.removeEventListener("resize", updateAlign);
    }
  }, [state, isSearchEnabled]);

  const toggle = () => {
    if (state !== "open") {
      setMenuAlign(computeDropdownAlign(containerRef.current, 220, { checkScrollParent: true }));
      setState("open");
    } else {
      setState("closing");
    }
  };

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
    <div className="relative max-w-full min-w-0" ref={containerRef}>
      <button 
        type="button" 
        onClick={toggle}
        className={`flex items-center gap-2 rounded-lg px-4 shadow-2xs transition-colors h-[38px] max-w-full min-w-0 cursor-pointer ${isActive && activeClassName ? activeClassName : 'bg-white border border-[#efefef] hover:bg-[#faf9f7]'}`}
      >
        {icon && <span className={`shrink-0 ${isActive ? "" : "text-[#777c86]"}`}>{icon}</span>}
        <span className={`text-[13px] font-medium whitespace-nowrap truncate min-w-0 ${isActive ? "" : "text-[#121722]"}`}>
          {labelPrefix && <span className={isActive ? "" : "text-[#777c86] font-normal mr-1"}>{labelPrefix}</span>}
          {selectedOption?.label}
        </span>
        {isActive && onClear ? (
          <div 
            onClick={(e) => { e.stopPropagation(); onClear(e); }}
            className="hover:bg-black/10 rounded-[4px] p-0.5 -mr-1 transition-colors shrink-0"
          >
            <X size={14} />
          </div>
        ) : (
          <ChevronDown size={14} className={`shrink-0 ${isActive ? "" : "text-[#777c86]"}`} />
        )}
      </button>

      {(state === "open" || state === "closing") && (
        <div
          role="menu"
          data-origin={menuAlign === "end" ? "top-right" : "top-left"}
          className={
            `t-dropdown absolute top-full mt-2 ${menuAlign === "end" ? "right-0" : "left-0"} min-w-[180px] max-w-[260px] bg-white border border-[#efefef] rounded-2xl shadow-xl p-1.5 z-50 flex flex-col overflow-hidden` +
            (state === "open" ? " is-open" : "") +
            (state === "closing" ? " is-closing" : "")
          }
          style={{ maxHeight: '33.33vh' }}
        >
          {isSearchEnabled && (
            <div className="pb-1.5 mb-1 border-b border-[#f1f3f5] bg-white shrink-0">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-[#a5a5a5] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-6 py-1.5 text-[13px] bg-[#faf9f7] border border-[#efefef] rounded-[10px] focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none text-[#121722] placeholder:text-[#a5a5a5]"
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
                    className="absolute right-2 p-0.5 text-[#a5a5a5] hover:text-[#121722] rounded-[4px]"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-[13px] text-[#a5a5a5]">
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
                  className={`w-full flex items-center justify-between text-left px-3 py-1.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                    value === opt.value
                      ? 'bg-[#e8f1ff] text-[#0068f9] font-semibold'
                      : 'text-[#121722] hover:bg-[#faf9f7]'
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {value === opt.value && <Check size={14} className="text-[#0068f9] shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
