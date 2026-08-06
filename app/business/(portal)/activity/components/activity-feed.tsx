'use client';

/**
 * The timeline itself, grouped by day.
 * SCOPE: Business module ONLY.
 *
 * A grouped timeline rather than a table: the rows are heterogeneous, so a
 * table would be mostly empty cells, and the message is a full sentence that
 * needs horizontal room. Day headers also match the question owners actually
 * ask, which is "what happened yesterday".
 */

import Link from 'next/link';
import { Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityEvent } from '@/lib/business/activity/types';
import { ActivityRow } from './activity-row';
import { ActivityRowsSkeleton } from './activity-skeleton';

interface ActivityFeedProps {
  events: ActivityEvent[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  hasFilters: boolean;
  showSeverityBadge: boolean;
  formatMoney: (amount: number, currency: string | null) => string;
  liveEntityIds?: ReadonlySet<string>;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function groupByDay(events: ActivityEvent[]): Array<[string, ActivityEvent[]]> {
  const groups = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const label = dayLabel(event.createdAt);
    const existing = groups.get(label);
    if (existing) existing.push(event);
    else groups.set(label, [event]);
  }
  return Array.from(groups.entries());
}

export function ActivityFeed({
  events,
  loading,
  loadingMore,
  hasMore,
  hasFilters,
  showSeverityBadge,
  formatMoney,
  liveEntityIds,
  onLoadMore,
  onClearFilters,
}: ActivityFeedProps) {
  if (loading) {
    return <ActivityRowsSkeleton rows={8} />;
  }

  if (!events.length) {
    // Two distinct empty states: nothing has happened, versus nothing matches.
    // The second one gets an action, not just advice.
    return hasFilters ? (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground">
          No activity matches these filters
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try a wider date range, or clear the category filter.
        </p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground">No activity yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Actions taken in your account will show up here. Create a booking or top up your
          wallet to get started.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/business/bookings/new">Create a booking</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupByDay(events).map(([label, dayEvents]) => (
        <section key={label}>
          <h2 className="sticky top-14 z-10 -mx-1 mb-1 border-b border-border bg-background/95 px-1 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            {label}
          </h2>
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <ActivityRow
                key={event.id}
                event={event}
                formatMoney={formatMoney}
                liveEntityIds={liveEntityIds}
                showSeverityBadge={showSeverityBadge}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-center pt-2">
        {hasMore ? (
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {loadingMore ? 'Loading' : 'Load more'}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">You have reached the end</p>
        )}
      </div>
    </div>
  );
}
