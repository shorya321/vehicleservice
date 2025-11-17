import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-luxury-gold/10 p-4">
          <Icon className="h-8 w-8 text-luxury-gold" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-luxury-pearl">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-luxury-lightGray">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
