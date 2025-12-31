import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
  {
    variants: {
      variant: {
        // Primary gold gradient button - matches auth tab styling
        default: "bg-gradient-to-br from-[#C6AA88] to-[#A68B5B] text-[#050506] shadow-[0_4px_15px_-3px_rgba(198,170,136,0.4)] hover:shadow-[0_8px_25px_-5px_rgba(198,170,136,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        // Gold border outline button
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground active:scale-95",
        // Subtle muted button
        subtle: "bg-muted text-muted-foreground hover:bg-muted/80",
        // Ghost button with accent hover
        ghost: "hover:bg-accent/10 text-accent-foreground",
        // Destructive action
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl active:scale-95",
        // Secondary action
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
        // Premium gold gradient button - matches auth button styling
        premium: "bg-gradient-to-br from-[#C6AA88] to-[#A68B5B] text-[#050506] font-semibold shadow-md hover:shadow-lg active:scale-95",
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