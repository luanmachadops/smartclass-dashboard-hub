
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border backdrop-blur-sm px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-medium shadow-sm hover:shadow-md",
          "border-purple-200/60 dark:border-purple-400/30",
          "bg-white/70 dark:bg-gray-800/60",
          "focus-visible:ring-purple-400/50 focus-visible:border-purple-400/50",
          "hover:bg-white/80 dark:hover:bg-gray-800/70",
          "hover:border-purple-300/70 dark:hover:border-purple-400/40",
          "focus-visible:shadow-[0_4px_16px_rgba(147,51,234,0.2)] dark:focus-visible:shadow-[0_4px_16px_rgba(167,85,255,0.3)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
