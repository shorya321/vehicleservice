import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase tracking-wider",
  {
    variants: {
      variant: {
        // Primary badge (uses primary color from CSS variables)
        default:
          "bg-primary/15 text-primary border-primary/30 shadow-sm",

        // Secondary badge (uses muted colors)
        secondary:
          "bg-secondary text-secondary-foreground border-border",

        // Destructive badge (red for errors)
        destructive:
          "bg-red-500/15 text-red-500 border-red-500/30",

        // Outline badge (primary outline)
        outline: "border-primary/40 text-primary bg-transparent",

        // Success badge (emerald for confirmed/completed states)
        success:
          "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",

        // Warning badge (amber for pending states)
        warning:
          "bg-amber-500/15 text-amber-500 border-amber-500/30",

        // Error badge (red variant for failures)
        error:
          "bg-red-500/15 text-red-500 border-red-500/30",

        // Info badge (cyan for neutral info)
        info:
          "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
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