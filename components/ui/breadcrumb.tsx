import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  /** Where the leading home crumb links. Defaults to the admin dashboard. */
  homeHref?: string
  /** Text of the leading home crumb. Defaults to "Admin". */
  homeLabel?: string
}

const crumbClass =
  "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[13px] text-muted-foreground transition-colors"

export function Breadcrumb({
  items,
  className,
  homeHref = "/admin/dashboard",
  homeLabel = "Admin",
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-[var(--card-shadow)]",
        className
      )}
    >
      <Link href={homeHref} className={cn(crumbClass, "hover:text-foreground")}>
        <Home className="h-3.5 w-3.5" />
        {homeLabel}
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {item.href && !isLast ? (
              <Link href={item.href} className={cn(crumbClass, "hover:text-foreground")}>
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(crumbClass, isLast && "bg-primary/10 text-foreground")}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
