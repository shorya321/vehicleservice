/**
 * Quotation list loading state.
 *
 * Shaped to the real page — header, 4-up stat row, filter bar, table card — so the layout does
 * not jump when the data lands. Follows the dashboard-skeletons.tsx idiom (Skeleton on
 * bg-muted/50).
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function QuotationsLoading() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-lg bg-muted/50" />
        <Skeleton className="h-5 w-96 max-w-full rounded bg-muted/50" />
      </div>

      {/* Stat row — 4-up, matching QuotationStats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16 rounded bg-muted/50" />
                <Skeleton className="h-8 w-12 rounded bg-muted/50" />
                <Skeleton className="h-3 w-20 rounded bg-muted/50" />
              </div>
              <Skeleton className="h-11 w-11 rounded-full bg-muted/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter row + primary action */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-10 flex-1 rounded-md bg-muted/50" />
        <Skeleton className="h-10 w-full rounded-md bg-muted/50 sm:w-52" />
        <Skeleton className="h-10 w-full rounded-md bg-muted/50 lg:w-40" />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <Skeleton className="h-4 w-32 rounded bg-muted/50" />
          <Skeleton className="h-4 w-16 rounded bg-muted/50" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-4 w-24 rounded bg-muted/50" />
              <Skeleton className="h-4 flex-1 rounded bg-muted/50" />
              <Skeleton className="hidden h-6 w-20 rounded-full bg-muted/50 sm:block" />
              <Skeleton className="hidden h-4 w-24 rounded bg-muted/50 md:block" />
              <Skeleton className="h-4 w-20 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
