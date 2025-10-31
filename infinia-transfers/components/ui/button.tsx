import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
  {
    variants: {
      variant: {
        // Primary action button
        default: "bg-luxury-gold text-luxury-black hover:bg-luxury-gold/90 shadow-md hover:shadow-lg",
        // Secondary action button
        outline: "border-2 border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black",
        // Tertiary action button, for less emphasis
        subtle: "bg-luxury-gray/60 text-luxury-pearl hover:bg-luxury-gray",
        // Ghost button for icon-only or minimal actions
        ghost: "hover:bg-luxury-gold/10 text-luxury-gold",
      },
      size: {
        sm: "h-10 px-4 text-xs",
        default: "h-12 px-6",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
