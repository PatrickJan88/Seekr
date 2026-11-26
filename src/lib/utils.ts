import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DropdownAlign = "start" | "end";

/**
 * Computes dropdown horizontal alignment relative to its trigger element.
 * Defaults to left-aligned ("start"), dynamically adapting to right-aligned ("end")
 * when expanding rightward from the trigger's left edge would overflow available space.
 */
export function computeDropdownAlign(
  triggerEl: HTMLElement | null,
  estimatedMenuWidth: number,
  options?: { edgeMargin?: number; checkScrollParent?: boolean }
): DropdownAlign {
  if (!triggerEl || typeof window === "undefined") return "start";

  const edgeMargin = options?.edgeMargin ?? 16;
  const rect = triggerEl.getBoundingClientRect();

  let leftBoundary = 0;
  let rightBoundary = window.innerWidth;

  if (options?.checkScrollParent) {
    let parent = triggerEl.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const overflowX = style.overflowX;
      if (overflowX === "hidden" || overflowX === "auto" || overflowX === "scroll") {
        const parentRect = parent.getBoundingClientRect();
        leftBoundary = Math.max(leftBoundary, parentRect.left);
        rightBoundary = Math.min(rightBoundary, parentRect.right);
        break;
      }
      parent = parent.parentElement;
    }
  }

  const spaceWhenLeftAligned = rightBoundary - rect.left - edgeMargin;
  if (spaceWhenLeftAligned >= estimatedMenuWidth) {
    return "start";
  }

  const spaceWhenRightAligned = rect.right - leftBoundary - edgeMargin;
  return spaceWhenRightAligned > spaceWhenLeftAligned ? "end" : "start";
}

