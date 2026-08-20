import * as React from "react"
import { cn } from "../../lib/utils"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, type, scrollHideDelay, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-auto", className)}
        {...props}
      >
        <div className="h-full w-full">{children}</div>
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
