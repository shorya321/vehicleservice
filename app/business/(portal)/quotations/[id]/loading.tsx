/**
 * Quotation detail loading state.
 *
 * Mirrors the real page: breadcrumb + title + actions, the status hero strip, then the 2/1
 * itinerary / totals grid.
 */

import { Skeleton } from '@/components/ui/skeleton';

function SectionCardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <Skeleton className="h-4 w-28 rounded bg-muted/50" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg bg-muted/50" />
        ))}
      </div>
    </div>
  );
}

export default function QuotationDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44 rounded bg-muted/50" />
          <Skeleton className="h-9 w-64 rounded-lg bg-muted/50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-md bg-muted/50" />
          <Skeleton className="h-10 w-28 rounded-md bg-muted/50" />
        </div>
      </div>

      {/* Status hero */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full bg-muted/50" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 rounded bg-muted/50" />
            <Skeleton className="h-4 w-64 max-w-full rounded bg-muted/50" />
          </div>
        </div>
        <div className="space-y-2 sm:text-right">
          <Skeleton className="h-3 w-12 rounded bg-muted/50" />
          <Skeleton className="h-8 w-32 rounded bg-muted/50" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCardSkeleton rows={3} />
        </div>
        <div>
          <SectionCardSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}
