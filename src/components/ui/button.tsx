
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-lg hover:shadow-2xl hover:-translate-y-1 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-400 dark:to-purple-500 dark:hover:from-purple-500 dark:hover:to-purple-600 text-white border-0 shadow-[0_4px_16px_rgba(147,51,234,0.3)] dark:shadow-[0_4px_16px_rgba(167,85,255,0.4)] hover:shadow-[0_8px_32px_rgba(147,51,234,0.4)] dark:hover:shadow-[0_8px_32px_rgba(167,85,255,0.5)]",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.4)]",
        outline:
          "border border-purple-200/60 dark:border-purple-400/30 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/80 hover:text-accent-foreground text-purple-700 dark:text-purple-300 hover:border-purple-300/80 dark:hover:border-purple-400/50 hover:shadow-[0_4px_16px_rgba(147,51,234,0.2)] dark:hover:shadow-[0_4px_16px_rgba(167,85,255,0.3)]",
        secondary:
          "bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-slate-900 dark:text-white shadow-[0_4px_16px_rgba(100,116,139,0.2)] dark:shadow-[0_4px_16px_rgba(148,163,184,0.3)]",
        ghost: "hover:bg-white/70 dark:hover:bg-gray-800/60 hover:text-accent-foreground backdrop-blur-sm text-purple-700 dark:text-purple-300 hover:shadow-[0_4px_16px_rgba(147,51,234,0.15)] dark:hover:shadow-[0_4px_16px_rgba(167,85,255,0.25)]",
        link: "text-purple-600 dark:text-purple-400 underline-offset-4 hover:underline shadow-none hover:shadow-none hover:translate-y-0",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
