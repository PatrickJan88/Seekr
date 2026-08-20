import * as React from "react"
import { cn } from "../../lib/utils"

export interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "xs"
}

const Kbd = React.forwardRef<HTMLSpanElement, KbdProps>(
  ({ className, size = "sm", ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-[#efefef] bg-white shadow-2xs font-sans font-semibold text-[#121722]",
          size === "sm" && "h-6 min-w-[24px] px-1.5 text-xs",
          size === "xs" && "h-5 min-w-[20px] px-1.5 text-[10px]",
          className
        )}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd }
