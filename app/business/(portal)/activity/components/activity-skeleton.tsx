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
            <Skeleton className="h-4 w-3/4 rounded bg-muted/50" />
            <Skeleton className="h-3 w-1/3 rounded bg-muted/50" />
          </div>
          <Skeleton className="h-3 w-16 shrink-0 rounded bg-muted/50" />
        </div>
      ))}
    </div>
  );
}

export function ActivityPageSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-lg bg-muted/50" />
        <Skeleton className="h-5 w-96 max-w-full rounded bg-muted/50" />
      </div>

      {/* Stat strip, shaped like the real tiles rather than four bare blocks */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-md rounded-lg bg-muted/50" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 flex-1 rounded-md bg-muted/50" />
            <Skeleton className="h-9 w-full rounded-lg bg-muted/50 sm:w-56" />
            <Skeleton className="h-9 w-full rounded-md bg-muted/50 sm:w-32" />
          </div>
        </div>
      </div>

      {/* Feed card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <Skeleton className="h-3 w-28 rounded bg-muted/50" />
          <Skeleton className="h-3 w-16 rounded bg-muted/50" />
        </div>
        <div className="space-y-6 p-2 sm:p-3">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="space-y-2">
              <Skeleton className="h-4 w-32 rounded bg-muted/50" />
              <ActivityRowsSkeleton rows={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
