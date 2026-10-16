import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type QueryValue = string | string[] | number | undefined | null

interface PagePaginationProps {
  /** Route the page links point at, e.g. "/admin/bookings". */
  pathname: string
  page: number
  totalPages: number
  total: number
  limit: number
  /** Plural noun for the summary line, e.g. "bookings". */
  noun: string
  /** Current search params, kept on every page link. */
  query?: Record<string, QueryValue>
  /** Query key the page number is written to. Defaults to "page". */
  paramName?: string
  className?: string
}

const WINDOW = 5

function pageWindow(page: number, totalPages: number): number[] {
  const count = Math.min(WINDOW, totalPages)
  const start = Math.min(Math.max(1, page - Math.floor(WINDOW / 2)), totalPages - count + 1)
  return Array.from({ length: count }, (_, i) => start + i)
}

const linkClass =
  'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-transparent px-2.5 text-sm tabular-nums text-foreground transition-colors hover:bg-muted'

/**
 * "Showing X to Y of Z" with Previous, a five-page window and Next, as plain
 * links that keep the current filters. Renders nothing for a single page.
 */
export function PagePagination({
  pathname,
  page,
  totalPages,
  total,
  limit,
  noun,
  query = {},
  paramName = 'page',
  className,
}: PagePaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null

  const hrefFor = (target: number) => ({ pathname, query: { ...query, [paramName]: target } })
  const first = (page - 1) * limit + 1
  const last = Math.min(page * limit, total)

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <p className="text-sm text-muted-foreground">
        Showing {first} to {last} of {total} {noun}
      </p>
      <nav aria-label="Pages" className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Link>
        ) : (
          <span className={cn(linkClass, 'pointer-events-none text-muted-foreground')} aria-disabled="true">
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </span>
        )}
        {pageWindow(page, totalPages).map((n) => (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? 'page' : undefined}
            className={cn(linkClass, n === page && 'border-border bg-card font-semibold')}
          >
            {n}
          </Link>
        ))}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className={cn(linkClass, 'pointer-events-none text-muted-foreground')} aria-disabled="true">
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </nav>
    </div>
  )
}
