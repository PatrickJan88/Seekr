import React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EASE_OUT } from "./expandable-tabs-utils/ease";
import { cn } from "../../lib/utils";

export type ExpandableTabSubOption = {
  indexLabel?: string;
  badge?: number | string;
  label: string;
  active?: boolean;
  onClick: () => void;
};

export type ExpandableTabsItem = {
  id: string;
  /** String label — shown inside the active tab and used as the button's accessible name. */
  label: string;
  icon: ReactNode;
  /**
   * "group" opens an upward drawer with `content`.
   * "direct" navigates immediately on click via `onDirectClick` and optionally shows
   * numbered sub-tab choices on hover via `directSubOptions`.
   */
  kind?: "group" | "direct";
  /** Panel shown above the bar when this group tab is active. */
  content?: ReactNode;
  /** Direct 1-click navigation handler for "direct" tabs. */
  onDirectClick?: () => void;
  /** Numbered sub-tab choices surfaced on hover for "direct" tabs. */
  directSubOptions?: ExpandableTabSubOption[];
  /** Shows a subtle active-route indicator dot when the current view lives inside this tab. */
  hasCurrent?: boolean;
  /** Highlights this direct icon as the currently active top-level view. */
  isDirectActive?: boolean;
};

export type ExpandableTabsClassNames = {
  root?: string;
  panel?: string;
  bar?: string;
  tab?: string;
  activeTab?: string;
  icon?: string;
  label?: string;
  pill?: string;
};

export interface ExpandableTabsProps {
  items: ExpandableTabsItem[];
  /** Active tab id, or null/undefined for the closed (bar-only) state. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null) => void;
  /** Fixed content area height (excluding dock bar & padding) when expanded so hovering sub-options never shifts the dock vertically. */
  expandedContentHeight?: number;
  className?: string;
  classNames?: ExpandableTabsClassNames;
}

type Size = { width: number; height: number };

const SHELL_SPRING = { type: "spring", duration: 0.58, bounce: 0.06 } as const;

const TAB_CHANGE_SPRING = {
  type: "spring",
  duration: 0.46,
  bounce: 0.04,
} as const;
const LABEL_OPEN = { type: "spring", duration: 0.38, bounce: 0.03 } as const;
const LABEL_CLOSE = { duration: 0.16, ease: EASE_OUT } as const;

const BAR_H = 52;
const TAB_W = 32;
const BAR_PADDING_X = 12;
const BAR_GAP = 4;
const ROOT_BORDER = 2;
const ICON_W = 16;
const ACTIVE_LEFT_PAD = 10;
const ACTIVE_RIGHT_PAD = 16;
const LABEL_GAP = 7;
const PANEL_DOCK_GAP = 0;
const PANEL_PAD_V = 10;
const PANEL_X_PAD = 16;
const PANEL_MAX_CONTENT_H = 340;

const CONTENT_VARIANTS: Variants = {
  enter: { y: -8, scale: 0.98, opacity: 0, filter: "blur(4px)" },
  center: { y: 0, scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: {
    y: -6,
    scale: 0.98,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.08, ease: EASE_OUT },
  },
};

const REDUCED_CONTENT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: "blur(0px)" },
  center: { opacity: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    filter: "blur(0px)",
    transition: { duration: 0.08, ease: EASE_OUT },
  },
};

const CONTENT_SPRING = {
  type: "spring",
  duration: 0.46,
  bounce: 0.08,
} as const;

function sameSize(a: Size | null | undefined, b: Size | null | undefined) {
  return a?.width === b?.width && a?.height === b?.height;
}

function sameWidths(a: Record<string, number>, b: Record<string, number>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

function useGroupPanelSizes(
  groupItems: ExpandableTabsItem[],
  activeGroupId: string | null,
  expandedContentHeight?: number,
) {
  const sizerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const livePanelRef = useRef<HTMLDivElement | null>(null);
  const groupItemsRef = useRef(groupItems);
  groupItemsRef.current = groupItems;
  const [sizesById, setSizesById] = useState<Record<string, Size>>({});
  const [liveSize, setLiveSize] = useState<Size | null>(null);

  const groupKey = groupItems.map((item) => item.id).join("|");

  const setSizerRef = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      sizerRefs.current[id] = node;
    },
    [],
  );

  const measureStatic = useCallback(() => {
    const next: Record<string, Size> = {};
    for (const item of groupItemsRef.current) {
      const node = sizerRefs.current[item.id];
      if (node) {
        const contentH =
          expandedContentHeight ??
          Math.min(node.offsetHeight, PANEL_MAX_CONTENT_H);
        next[item.id] = {
          width: node.offsetWidth + PANEL_X_PAD,
          height: contentH + PANEL_PAD_V * 2 + BAR_H + PANEL_DOCK_GAP,
        };
      }
    }
    setSizesById((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((k) => sameSize(prev[k], next[k]))
      ) {
        return prev;
      }
      return next;
    });
  }, [groupKey, expandedContentHeight]);

  useLayoutEffect(() => {
    measureStatic();
  }, [measureStatic]);

  const measureLive = useCallback(() => {
    const node = livePanelRef.current;
    if (!node) {
      setLiveSize(null);
      return;
    }
    const contentH =
      expandedContentHeight ??
      Math.min(node.offsetHeight, PANEL_MAX_CONTENT_H);
    const next: Size = {
      width: node.offsetWidth + PANEL_X_PAD,
      height: contentH + PANEL_PAD_V * 2 + BAR_H + PANEL_DOCK_GAP,
    };
    setLiveSize((prev) => (sameSize(prev, next) ? prev : next));
  }, [expandedContentHeight]);

  useLayoutEffect(() => {
    if (!activeGroupId) {
      setLiveSize(null);
      return;
    }
    measureLive();
    const raf = requestAnimationFrame(measureLive);
    return () => cancelAnimationFrame(raf);
  }, [activeGroupId, measureLive]);

  useEffect(() => {
    if (!activeGroupId || typeof ResizeObserver === "undefined") return;
    const node = livePanelRef.current;
    if (!node) return;
    const observer = new ResizeObserver(measureLive);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeGroupId, measureLive]);

  const resolvedSize: Size | null = activeGroupId
    ? liveSize ?? sizesById[activeGroupId] ?? null
    : null;

  return { setSizerRef, livePanelRef, resolvedSize };
}

function useLabelWidths(items: ExpandableTabsItem[]) {
  const refs = useRef<Record<string, HTMLSpanElement | null>>({});
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [widths, setWidths] = useState<Record<string, number>>({});

  const itemsKey = items.map((item) => `${item.id}:${item.label}`).join("|");

  const setLabelMeasureRef = useCallback(
    (id: string) => (node: HTMLSpanElement | null) => {
      refs.current[id] = node;
    },
    [],
  );

  const measure = useCallback(() => {
    const next: Record<string, number> = {};

    for (const item of itemsRef.current) {
      const node = refs.current[item.id];

      if (node) {
        next[item.id] = Math.ceil(node.offsetWidth);
      }
    }

    setWidths((current) => (sameWidths(current, next) ? current : next));
  }, [itemsKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);

    for (const item of itemsRef.current) {
      const node = refs.current[item.id];

      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [itemsKey, measure]);

  return { setLabelMeasureRef, widths };
}

export function ExpandableTabs({
  items,
  value,
  defaultValue = null,
  onValueChange,
  expandedContentHeight,
  className,
  classNames,
}: ExpandableTabsProps) {
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hoverCloseTimerRef = useRef<number | null>(null);

  const groupItems = useMemo(
    () => items.filter((item) => (item.kind ?? "group") === "group"),
    [items],
  );

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const activeId = controlled ? value : internal;
  const active =
    groupItems.find((item) => item.id === activeId) ?? null;
  const visualActiveId = active?.id ?? null;

  const { setSizerRef, livePanelRef, resolvedSize } = useGroupPanelSizes(
    groupItems,
    visualActiveId,
    expandedContentHeight,
  );
  const { setLabelMeasureRef, widths: labelWidths } = useLabelWidths(items);

  const [hoveredDirect, setHoveredDirect] = useState<{
    id: string;
    centerX: number;
  } | null>(null);
  const [hoveredBarIcon, setHoveredBarIcon] = useState<{
    id: string;
    label: string;
    centerX: number;
  } | null>(null);

  const setActive = useCallback(
    (next: string | null) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  const clearHoverTimer = useCallback(() => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const openDirectHover = useCallback(
    (item: ExpandableTabsItem) => {
      clearHoverTimer();
      if (!item.directSubOptions?.length) {
        setHoveredDirect(null);
        return;
      }
      const btn = buttonRefs.current[item.id];
      if (!btn) return;
      const centerX = btn.offsetLeft + btn.offsetWidth / 2;
      setHoveredDirect({ id: item.id, centerX });
    },
    [clearHoverTimer],
  );

  const scheduleCloseDirectHover = useCallback(() => {
    clearHoverTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setHoveredDirect(null);
    }, 110);
  }, [clearHoverTimer]);

  useEffect(() => {
    return () => clearHoverTimer();
  }, [clearHoverTimer]);

  const openBarTooltip = useCallback((item: ExpandableTabsItem) => {
    const btn = buttonRefs.current[item.id];
    if (!btn) return;
    setHoveredBarIcon({
      id: item.id,
      label: item.label,
      centerX: btn.offsetLeft + btn.offsetWidth / 2,
    });
  }, []);

  const closeBarTooltip = useCallback(() => {
    setHoveredBarIcon(null);
  }, []);

  useEffect(() => {
    if (visualActiveId) {
      setHoveredDirect(null);
      setHoveredBarIcon(null);
    }
  }, [visualActiveId]);

  useEffect(() => {
    if (!visualActiveId && !hoveredDirect) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setActive(null);
        setHoveredDirect(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setHoveredDirect(null);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [setActive, visualActiveId, hoveredDirect]);

  const getActiveTabWidth = useCallback(
    (item: ExpandableTabsItem) =>
      Math.max(
        TAB_W,
        ACTIVE_LEFT_PAD +
          ICON_W +
          LABEL_GAP +
          (labelWidths[item.id] ?? 0) +
          ACTIVE_RIGHT_PAD,
      ),
    [labelWidths],
  );

  const dividerCount =
    (items.some((item) => item.id === "account") ? 1 : 0) +
    (items.some((item) => item.id === "company-360") ? 1 : 0);
  // Divider box is w-[1px] (1px) + mx-0.5 (4px) = 5px, plus 1 extra BAR_GAP inserted in the flex row
  const DIVIDER_BOX_W = 5;
  const dividersWidth = dividerCount * (DIVIDER_BOX_W + BAR_GAP);

  const closedSize = {
    width:
      items.length * TAB_W +
      Math.max(0, items.length - 1) * BAR_GAP +
      dividersWidth +
      BAR_PADDING_X * 2 +
      ROOT_BORDER,
    height: BAR_H + ROOT_BORDER,
  };
  const maxActiveBarWidth = groupItems.reduce((maxW, item) => {
    const w =
      Math.max(0, items.length - 1) * TAB_W +
      Math.max(0, items.length - 1) * BAR_GAP +
      dividersWidth +
      getActiveTabWidth(item) +
      BAR_PADDING_X * 2 +
      ROOT_BORDER;
    return Math.max(maxW, w);
  }, closedSize.width);

  const openSize = resolvedSize
    ? {
        width: Math.max(resolvedSize.width + ROOT_BORDER, maxActiveBarWidth),
        height: Math.max(resolvedSize.height + ROOT_BORDER, closedSize.height),
      }
    : closedSize;
  const targetSize = active ? openSize : closedSize;

  const hoveredItem =
    hoveredDirect && !active
      ? items.find((item) => item.id === hoveredDirect.id) ?? null
      : null;

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {/* Design-system hover tooltip showing icon name on Dock */}
      <AnimatePresence>
        {hoveredBarIcon && hoveredBarIcon.id !== visualActiveId ? (
          <motion.div
            key={`tooltip-${hoveredBarIcon.id}`}
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.96 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            style={{
              left: hoveredBarIcon.centerX,
              bottom: BAR_H + ROOT_BORDER + 8,
            }}
            className="pointer-events-none absolute z-40 -translate-x-1/2"
          >
            <div className="whitespace-nowrap rounded-xl bg-[#121722] px-2.5 py-1 text-[12px] font-medium tracking-[-0.01em] text-white shadow-[0_8px_20px_-4px_rgba(18,23,34,0.28)]">
              {hoveredBarIcon.label}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Hover quick-pick popover for direct Dock entry points if any define sub-options */}
      <AnimatePresence>
        {hoveredItem && hoveredDirect && hoveredItem.directSubOptions?.length ? (
          <motion.div
            key={hoveredItem.id}
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 6, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 4, scale: 0.97 }
            }
            transition={{ duration: 0.16, ease: EASE_OUT }}
            onMouseEnter={clearHoverTimer}
            onMouseLeave={scheduleCloseDirectHover}
            style={{
              left: hoveredDirect.centerX,
              bottom: BAR_H + ROOT_BORDER,
            }}
            className="absolute z-40 -translate-x-1/2 pb-2.5"
          >
            <div className="min-w-[210px] rounded-2xl border border-[#efefef] bg-white p-1.5 shadow-[0_14px_34px_-8px_rgba(18,23,34,0.18)]">
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-[#a5a5a5] uppercase border-b border-[#efefef] mb-1">
                <span>{hoveredItem.label}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {hoveredItem.directSubOptions.map((opt) => (
                  <button
                    key={opt.indexLabel ?? opt.label}
                    type="button"
                    onClick={() => {
                      opt.onClick();
                      setHoveredDirect(null);
                      setActive(null);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer whitespace-nowrap",
                      opt.active
                        ? "bg-[#f4f4f5] text-[#121722] font-semibold"
                        : "text-[#525866] font-medium hover:bg-[#faf9f7] hover:text-[#121722]",
                    )}
                  >
                    {opt.indexLabel && (
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums transition-colors",
                          opt.active
                            ? "border-[#0068f9]/30 bg-[#e8f1ff] text-[#0068f9]"
                            : "border-[#efefef] bg-[#faf9f7] text-[#777c86] group-hover:bg-white group-hover:text-[#121722]",
                        )}
                      >
                        {opt.indexLabel}
                      </span>
                    )}
                    <span className="flex flex-1 min-w-0 items-center gap-2">
                      {opt.active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0068f9] shrink-0" />
                      ) : null}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {opt.badge !== undefined && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-[#e4e4e7] text-[#121722] tabular-nums">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        ref={rootRef}
        initial={false}
        animate={
          targetSize
            ? { width: targetSize.width, height: targetSize.height }
            : undefined
        }
        transition={reduce ? { duration: 0 } : SHELL_SPRING}
        style={{ transformOrigin: "bottom center" }}
        className={cn(
          "relative overflow-hidden rounded-[26px] border border-[#efefef] bg-white shadow-xl",
          className,
          classNames?.root,
        )}
      >
        {/* Hidden static sizers per group tab for instant first-frame dimensions */}
        <div
          aria-hidden
          className="pointer-events-none invisible fixed left-0 top-0 -z-10 flex items-start"
        >
          {groupItems.map((item) => (
            <div
              key={item.id}
              ref={setSizerRef(item.id)}
              className="w-max"
            >
              {item.content}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "absolute left-0 right-0 top-0 z-10 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-3 custom-scrollbar",
            classNames?.panel,
          )}
          style={{ bottom: BAR_H + PANEL_DOCK_GAP }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {active ? (
              <motion.div
                key={active.id}
                variants={reduce ? REDUCED_CONTENT_VARIANTS : CONTENT_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={
                  reduce ? { duration: 0.15, ease: EASE_OUT } : CONTENT_SPRING
                }
                className="w-full"
                style={{
                  transformOrigin: "top center",
                  willChange: "transform, opacity, filter",
                }}
              >
                <div ref={livePanelRef} className="w-full">
                  {active.content}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div
          role="tablist"
          aria-label="Navigation tabs"
          aria-orientation="horizontal"
          className={cn(
            "absolute bottom-0 left-0 z-20 flex w-full items-center justify-between gap-1 px-3 py-2",
            classNames?.bar,
          )}
          style={{ height: BAR_H }}
        >
          {items.map((item) => {
            const isDirect = item.kind === "direct";
            const isExpandedActive = !isDirect && item.id === visualActiveId;
            const isDirectHighlighted = isDirect && !active && !!item.isDirectActive;
            const activeTabWidth = getActiveTabWidth(item);
            const labelWidth = labelWidths[item.id] ?? 0;

            return (
              <React.Fragment key={item.id}>
                {item.id === "account" && (
                  <div
                    aria-hidden="true"
                    className="h-4 w-[1px] shrink-0 bg-[#efefef] mx-0.5"
                  />
                )}
                <motion.button
                  ref={(node) => {
                    buttonRefs.current[item.id] = node;
                  }}
                  type="button"
                  role={isDirect ? undefined : "tab"}
                  aria-selected={isDirect ? undefined : isExpandedActive}
                  aria-current={isDirect && item.isDirectActive ? "page" : undefined}
                  aria-label={item.label}
                  onMouseEnter={() => {
                    if (isDirect && !active && item.directSubOptions?.length) {
                      closeBarTooltip();
                      openDirectHover(item);
                    } else if (!isExpandedActive) {
                      openBarTooltip(item);
                    }
                  }}
                  onMouseLeave={() => {
                    closeBarTooltip();
                    if (isDirect) {
                      scheduleCloseDirectHover();
                    }
                  }}
                  onFocus={() => {
                    if (isDirect && !active && item.directSubOptions?.length) {
                      closeBarTooltip();
                      openDirectHover(item);
                    } else if (!isExpandedActive) {
                      openBarTooltip(item);
                    }
                  }}
                  onBlur={() => {
                    closeBarTooltip();
                    if (isDirect) {
                      scheduleCloseDirectHover();
                    }
                  }}
                  onClick={() => {
                    closeBarTooltip();
                    if (isDirect) {
                      setHoveredDirect(null);
                      setActive(null);
                      item.onDirectClick?.();
                    } else {
                      setHoveredDirect(null);
                      setActive(isExpandedActive ? null : item.id);
                    }
                  }}
                  layout={reduce ? false : "position"}
                  animate={{
                    width: active && isExpandedActive ? activeTabWidth : TAB_W,
                  }}
                  transition={reduce ? { duration: 0 } : TAB_CHANGE_SPRING}
                  className={cn(
                    "relative isolate flex h-9 min-w-8 shrink-0 items-center justify-center overflow-hidden rounded-[18px] px-2 text-sm font-medium outline-none cursor-pointer text-[#121722] hover:text-[#121722]",
                    classNames?.tab,
                    isExpandedActive && classNames?.activeTab,
                  )}
                >
                  {isExpandedActive || isDirectHighlighted ? (
                    <span
                      className={cn(
                        "absolute inset-0 -z-10 rounded-[18px] bg-[#f4f4f5]",
                        classNames?.pill,
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative grid shrink-0 place-items-center",
                      classNames?.icon,
                    )}
                  >
                    {item.icon}
                    {!isExpandedActive &&
                    !isDirectHighlighted &&
                    (item.hasCurrent || (isDirect && item.isDirectActive)) ? (
                      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#0068f9]" />
                    ) : null}
                  </span>
                  <motion.span
                    aria-hidden
                    initial={false}
                    animate={
                      reduce
                        ? {
                            width: isExpandedActive ? labelWidth : 0,
                            opacity: isExpandedActive ? 1 : 0,
                            marginLeft: isExpandedActive ? LABEL_GAP : 0,
                            filter: "blur(0px)",
                          }
                        : {
                            width: isExpandedActive ? labelWidth : 0,
                            opacity: isExpandedActive ? 1 : 0,
                            marginLeft: isExpandedActive ? LABEL_GAP : 0,
                            filter: isExpandedActive ? "blur(0px)" : "blur(3px)",
                          }
                    }
                    transition={
                      reduce
                        ? { duration: 0 }
                        : isExpandedActive
                          ? LABEL_OPEN
                          : LABEL_CLOSE
                    }
                    className={cn(
                      "inline-block overflow-hidden whitespace-nowrap",
                      classNames?.label,
                    )}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
                {item.id === "company-360" && (
                  <div
                    aria-hidden="true"
                    className="h-4 w-[1px] shrink-0 bg-[#efefef] mx-0.5"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 -z-10 flex opacity-0"
      >
        {items.map((item) => (
          <span
            className={cn(
              "whitespace-nowrap text-sm font-medium leading-none",
              classNames?.label,
            )}
            key={item.id}
            ref={setLabelMeasureRef(item.id)}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ExpandableTabs;
