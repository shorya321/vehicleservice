import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-luxury-gold/30 bg-luxury-gray/30 px-3 py-2 text-sm text-luxury-pearl font-sans placeholder:text-luxury-lightGray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:border-luxury-gold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-luxury-pearl",
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