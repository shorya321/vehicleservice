import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-sans uppercase tracking-wider",
  {
    variants: {
      variant: {
        // Primary badge (luxury gold)
        default:
          "bg-luxury-gold/20 text-luxury-gold border-luxury-gold/40 shadow-sm",

        // Secondary badge (luxury gray)
        secondary:
          "bg-luxury-gray/60 text-luxury-pearl border-luxury-gold/20",

        // Destructive badge (red for errors)
        destructive:
          "bg-red-600/20 text-red-400 border-red-600/40",

        // Outline badge (gold outline)
        outline: "border-luxury-gold/40 text-luxury-gold bg-transparent",

        // Success badge (emerald for completed states)
        success:
          "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",

        // Warning badge (gold light for pending)
        warning:
          "bg-luxury-goldLight/20 text-luxury-goldLight border-luxury-goldLight/40",

        // Error badge (red variant for failures)
        error:
          "bg-red-600/20 text-red-400 border-red-600/40",

        // Info badge (pearl/gray for neutral info)
        info:
          "bg-luxury-lightGray/20 text-luxury-lightGray border-luxury-lightGray/40",
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