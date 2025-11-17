import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
  {
    variants: {
      variant: {
        // Luxury gold primary button
        default: "bg-luxury-gold text-luxury-black hover:bg-luxury-gold/90 shadow-md hover:shadow-lg active:scale-95",
        // Gold border outline button
        outline: "border-2 border-luxury-gold text-luxury-gold bg-transparent hover:bg-luxury-gold hover:text-luxury-black active:scale-95",
        // Subtle gray button
        subtle: "bg-luxury-gray/60 text-luxury-pearl hover:bg-luxury-gray",
        // Ghost button with gold hover
        ghost: "hover:bg-luxury-gold/10 text-luxury-gold",
        // Destructive action
        destructive: "bg-red-600/80 hover:bg-red-600 text-white border border-red-600/40 shadow-lg hover:shadow-xl active:scale-95",
        // Secondary action
        secondary: "bg-luxury-gray/60 text-luxury-pearl hover:bg-luxury-gray/80 border border-luxury-gold/20",
        // Link style
        link: "text-luxury-gold underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-4 text-xs",
        default: "h-12 px-6",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
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