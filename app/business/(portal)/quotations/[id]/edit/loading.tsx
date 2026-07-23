/**
 * Quotation builder loading state.
 *
 * Mirrors the real page: breadcrumb + title, then the 2/1 trips / pricing grid the builder
 * renders.
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function EditQuotationLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-52 rounded bg-muted/50" />
        <Skeleton className="h-9 w-56 rounded-lg bg-muted/50" />
        <Skeleton className="h-5 w-72 max-w-full rounded bg-muted/50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trips */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
              <Skeleton className="h-4 w-20 rounded bg-muted/50" />
              <Skeleton className="h-8 w-24 rounded-md bg-muted/50" />
            </div>
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg bg-muted/50" />
              ))}
            </div>
          </div>
        </div>

        {/* Pricing rail */}
        <div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 px-5 py-4">
              <Skeleton className="h-4 w-20 rounded bg-muted/50" />
            </div>
            <div className="space-y-4 p-5">
              <Skeleton className="h-16 w-full rounded-md bg-muted/50" />
              <Skeleton className="h-16 w-full rounded-md bg-muted/50" />
              <Skeleton className="h-px w-full bg-border" />
              <Skeleton className="h-24 w-full rounded-md bg-muted/50" />
              <Skeleton className="h-10 w-full rounded-md bg-muted/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
