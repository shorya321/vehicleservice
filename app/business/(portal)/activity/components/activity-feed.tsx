'use client';

/**
 * The timeline itself, grouped by day.
 * SCOPE: Business module ONLY.
 *
 * A grouped timeline rather than a table: the rows are heterogeneous, so a
 * table would be mostly empty cells, and the message is a full sentence that
 * needs horizontal room. Day headers also match the question owners actually
 * ask, which is "what happened yesterday".
 *
 * It still sits in a PortalSectionCard, because every other list in the portal
 * does and an uncontained timeline read as a different product.
 */

import Link from 'next/link';
import { Activity, History, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/business/ui/empty-state';
import type { ActivityEvent } from '@/lib/business/activity/types';
import { PortalSectionCard } from '../../components/ui/section-card';
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

/**
 * PortalSectionCard clips with overflow-hidden, which would make it the nearest
 * scroll container and silently kill the sticky day headers. overflow-visible
 * wins through tailwind-merge; the body keeps its padding so no row ever
 * reaches the rounded corner that is no longer clipped.
 */
function FeedCard({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <PortalSectionCard
      title="Activity Log"
      icon={History}
      className="overflow-visible"
      bodyClassName="p-2 sm:p-3"
      action={
        count > 0 ? (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {count} shown
          </span>
        ) : undefined
      }
    >
      {children}
    </PortalSectionCard>
  );
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
    return (
      <FeedCard count={0}>
        <ActivityRowsSkeleton rows={8} />
      </FeedCard>
    );
  }

  if (!events.length) {
    // Two distinct empty states: nothing has happened, versus nothing matches.
    // The second one gets an action, not just advice.
    return (
      <FeedCard count={0}>
        <EmptyState
          icon={<Activity className="h-8 w-8" />}
          title={hasFilters ? 'No activity matches these filters' : 'No activity yet'}
          description={
            hasFilters
              ? 'Try a wider date range, or clear the category filter.'
              : 'Actions taken in your account will show up here. Create a booking or top up your wallet to get started.'
          }
          action={
            hasFilters ? (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/business/bookings/new">Create a booking</Link>
              </Button>
            )
          }
        />
      </FeedCard>
    );
  }

  return (
    <FeedCard count={events.length}>
      <div className="space-y-6">
        {groupByDay(events).map(([label, dayEvents]) => (
          <section key={label}>
            <h2 className="sticky top-14 z-10 -mx-1 mb-1 border-b border-border bg-card/95 px-1 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
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

        <div className="flex items-center justify-center border-t border-border pb-1 pt-4">
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
    </FeedCard>
  );
}
