import React, { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

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

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  labelPrefix?: string;
}

export function Dropdown({ options, value, onChange, icon, labelPrefix }: DropdownProps) {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggle = () => setState((s) => (s === "open" ? "closing" : "open"));

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button" 
        onClick={toggle}
        className="flex items-center gap-2 bg-white border border-[#efefef] rounded-2xl p-2 px-3 shadow-2xs hover:bg-[#faf9f7] transition-colors h-[34px] cursor-pointer"
      >
        {icon && <span className="text-[#777c86]">{icon}</span>}
        <span className="text-xs font-medium text-[#121722] whitespace-nowrap">
          {labelPrefix && <span className="text-[#777c86] font-normal mr-1">{labelPrefix}</span>}
          {selectedOption?.label}
        </span>
        <ChevronDown size={14} className="text-[#777c86]" />
      </button>

      {(state === "open" || state === "closing") && (
        <div
          role="menu"
          data-origin="top-center"
          className={
            "t-dropdown absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max min-w-[140px] bg-white border border-[#efefef] rounded-xl shadow-lg p-1 z-50 flex flex-col gap-0.5" +
            (state === "open" ? " is-open" : "") +
            (state === "closing" ? " is-closing" : "")
          }
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitem"
              onClick={() => {
                onChange(opt.value);
                setState("closing");
              }}
              className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${value === opt.value ? 'bg-[#faf9f7] text-[#121722]' : 'text-[#777c86] hover:bg-[#faf9f7] hover:text-[#121722]'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
