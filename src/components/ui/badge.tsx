
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 text-white shadow-[0_2px_8px_rgba(147,51,234,0.3)] dark:shadow-[0_2px_8px_rgba(167,85,255,0.4)] hover:shadow-[0_4px_12px_rgba(147,51,234,0.4)] dark:hover:shadow-[0_4px_12px_rgba(167,85,255,0.5)] hover:-translate-y-0.5",
        secondary:
          "border-transparent bg-white/70 dark:bg-gray-800/60 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-600/60 hover:bg-white/80 dark:hover:bg-gray-800/70",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:-translate-y-0.5",
        outline: "text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-400/30 bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
