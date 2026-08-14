import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Business Portal Button
 *
 * Geometry and typography are a deliberate match for components/ui/button.tsx
 * so the business module renders identically to before it stopped importing
 * that file. The only difference is the colour layer: where the shared button
 * hardcodes the gold gradient (#C6AA88 -> #A68B5B), this one reads
 * hsl(var(--primary)), which BusinessThemeProvider rewrites per tenant.
 *
 * SCOPE: Business module ONLY. Do not import from the customer, admin or
 * vendor surfaces.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
  {
    variants: {
      variant: {
        // Primary action - follows the tenant accent
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_15px_-3px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300",
        // Outline button using the tenant accent
        outline:
          "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground active:scale-95",
        // Subtle muted button
        subtle: "bg-muted text-muted-foreground hover:bg-muted/80",
        // Ghost button with a brand-tinted hover. Reads --primary rather than
        // --accent: the provider derives --accent from the mode's muted surface,
        // which is a neutral by shadcn convention and does not track the tenant.
        ghost: "hover:bg-primary/10 text-foreground",
        // Destructive action
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl active:scale-95",
        // Secondary action
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
        // Emphasised primary action - also follows the tenant accent
        premium:
          "bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg active:scale-95",
      },
      size: {
        sm: "h-9 px-4 text-sm",
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
