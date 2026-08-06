'use client';

/**
 * Loading placeholders shaped like the real feed, so nothing jumps when the
 * data lands.
 * SCOPE: Business module ONLY.
 */

import { Skeleton } from '@/components/ui/skeleton';

export function ActivityRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-3 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl bg-muted/50" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-muted/50" />
            <Skeleton className="h-3 w-1/3 bg-muted/50" />
          </div>
          <Skeleton className="h-3 w-16 shrink-0 bg-muted/50" />
        </div>
      ))}
    </div>
  );
}

export function ActivityPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 bg-muted/50" />
        <Skeleton className="h-4 w-96 max-w-full bg-muted/50" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl bg-muted/50" />
        ))}
      </div>

      <Skeleton className="h-28 rounded-xl bg-muted/50" />

      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, group) => (
          <div key={group} className="space-y-2">
            <Skeleton className="h-4 w-32 bg-muted/50" />
            <ActivityRowsSkeleton rows={4} />
          </div>
        ))}
      </div>
    </div>
  );
}
