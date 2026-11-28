import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface SlidingTabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  badge?: React.ReactNode;
  title?: string;
  ariaLabel?: string;
  /** Disable the ghost bold text wrapper for icon-only tabs */
  iconOnly?: boolean;
}

interface IndicatorState {
  left: number;
  width: number;
  ready: boolean;
}

/**
 * Measures the active tab element inside a relative tablist container and tracks
 * its exact horizontal position and width so an active pill can slide seamlessly.
 */
export function useSlidingIndicator(
  containerRef: React.RefObject<HTMLElement | null>,
  activeKey: string,
  deps: unknown[] = []
) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorState>({
    left: 0,
    width: 0,
    ready: false,
  });

  const setItemRef = useCallback((key: string) => {
    return (el: HTMLElement | null) => {
      if (el) {
        itemRefs.current.set(key, el);
      } else {
        itemRefs.current.delete(key);
      }
    };
  }, []);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const activeEl = itemRefs.current.get(activeKey);
    if (!container || !activeEl) return;

    const left = activeEl.offsetLeft;
    const width = activeEl.offsetWidth;
    if (width <= 0) return;

    setIndicator((prev) => {
      if (prev.ready && prev.left === left && prev.width === width) {
        return prev;
      }
      return { left, width, ready: true };
    });
  }, [containerRef, activeKey]);

  useLayoutEffect(() => {
    measure();
    const rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(container);
    const activeEl = itemRefs.current.get(activeKey);
    if (activeEl) observer.observe(activeEl);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, activeKey, measure, ...deps]);

  return { indicator, setItemRef };
}

interface SlidingTabsProps<T extends string> {
  items: SlidingTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tabClassName?: string;
  activePillClassName?: string;
  ariaLabel?: string;
  useTabRoles?: boolean;
}

export function SlidingTabs<T extends string>({
  items,
  value,
  onChange,
  className,
  tabClassName,
  activePillClassName,
  ariaLabel,
  useTabRoles = false,
}: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { indicator, setItemRef } = useSlidingIndicator(
    containerRef,
    value,
    [items.length, ...items.map((i) => (typeof i.badge === 'string' || typeof i.badge === 'number' ? i.badge : Boolean(i.badge)))]
  );

  return (
    <div
      ref={containerRef}
      role={useTabRoles ? 'tablist' : undefined}
      aria-label={ariaLabel}
      className={cn(
        'relative flex items-center gap-1 bg-[#faf9f7] h-[38px] p-1 border border-[#efefef] rounded-xl text-[13px] font-medium shrink-0 max-w-full overflow-x-auto no-scrollbar',
        className
      )}
    >
      {indicator.ready && (
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ x: indicator.left, width: indicator.width }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 480, damping: 36, mass: 0.75 }
          }
          className={cn(
            'pointer-events-none absolute top-1 bottom-1 left-0 rounded-lg bg-white border border-[#efefef] shadow-2xs z-0',
            activePillClassName
          )}
        />
      )}

      {items.map((item) => {
        const isActive = item.id === value;
        const innerContent = (
          <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>{item.label}</span>
            {item.badge}
          </span>
        );

        return (
          <button
            key={item.id}
            ref={setItemRef(item.id)}
            type="button"
            role={useTabRoles ? 'tab' : undefined}
            aria-selected={useTabRoles ? isActive : undefined}
            aria-label={item.ariaLabel}
            title={item.title}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative z-10 h-full px-3.5 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 select-none border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#0068f9]/30',
              isActive ? 'text-[#121722]' : 'text-[#777c86] hover:text-[#121722]',
              tabClassName
            )}
          >
            {item.iconOnly ? (
              innerContent
            ) : (
              <span className="grid place-items-center text-center">
                <span
                  className="invisible font-bold col-start-1 row-start-1 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  {innerContent}
                </span>
                <span
                  className={cn(
                    'col-start-1 row-start-1 transition-colors duration-200',
                    isActive ? 'font-bold text-[#121722]' : 'font-medium text-inherit'
                  )}
                >
                  {innerContent}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
