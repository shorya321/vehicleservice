'use client';

/**
 * One entry in the activity timeline.
 * SCOPE: Business module ONLY.
 */

import { createElement, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { renderActivityMessage } from '@/lib/business/activity/messages';
import type { ActivityEvent } from '@/lib/business/activity/types';
import { ActivityActorAvatar } from './activity-actor';
import { ActivityDetailPanel } from './activity-detail-panel';
import { activityIconFor, activityTintFor } from './activity-icon';

interface ActivityRowProps {
  event: ActivityEvent;
  formatMoney: (amount: number, currency: string | null) => string;
  /** Ids still present in their source table. Absent means struck through. */
  liveEntityIds?: ReadonlySet<string>;
  showSeverityBadge?: boolean;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)}h ago`;

  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function ActivityRow({
  event,
  formatMoney,
  liveEntityIds,
  showSeverityBadge,
}: ActivityRowProps) {
  const [expanded, setExpanded] = useState(false);

  const tint = activityTintFor(event.action, event.actorType);
  const segments = renderActivityMessage(event, { formatMoney, liveEntityIds });
  const isCritical = event.severity === 'critical';

  const absolute = new Date(event.createdAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'rounded-xl border border-transparent px-3 py-3 transition-colors hover:bg-muted/40',
        // Only critical rows get a marker. Badging everything is how audit logs
        // become unreadable.
        isCritical && 'border-l-2 border-l-red-500/60 bg-red-500/[0.03]'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9',
            tint
          )}
        >
          {/* createElement rather than a capitalized local: assigning the
              looked-up icon to `const Icon` reads to the linter as creating a
              component during render, even though it is an existing reference. */}
          {createElement(activityIconFor(event.action), { className: 'h-4 w-4' })}
        </span>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start gap-2">
            <ActivityActorAvatar
              actorType={event.actorType}
              actorName={event.actorName}
              className="mt-0.5"
            />
            <p className={cn('min-w-0 text-sm text-foreground', !expanded && 'line-clamp-3')}>
              {segments.map((segment, index) => {
                if (segment.kind === 'actor') {
                  return (
                    <span key={index} className="font-medium text-foreground">
                      {segment.value}
                    </span>
                  );
                }

                if (segment.kind === 'entity') {
                  if (segment.deleted) {
                    return (
                      <span
                        key={index}
                        title="This item was deleted"
                        className="line-through decoration-muted-foreground/40"
                      >
                        {segment.value}
                      </span>
                    );
                  }
                  if (segment.href) {
                    return (
                      <Link
                        key={index}
                        href={segment.href}
                        // The row itself toggles; the link must navigate.
                        onClick={(clickEvent) => clickEvent.stopPropagation()}
                        className="text-primary hover:underline"
                      >
                        {segment.value}
                      </Link>
                    );
                  }
                  return <span key={index}>{segment.value}</span>;
                }

                if (segment.kind === 'amount') {
                  return (
                    <span key={index} className="font-medium">
                      {segment.value}
                    </span>
                  );
                }

                return <span key={index}>{segment.value}</span>;
              })}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-muted-foreground" title={absolute}>
              {relativeTime(event.createdAt)}
            </p>
            {event.amount !== null && (
              <p className="text-xs font-medium text-foreground">
                {formatMoney(event.amount, event.currency)}
              </p>
            )}
          </div>

          {isCritical && (
            <Badge variant="outline" className="border-red-500/40 text-[10px] text-red-600 dark:text-red-400">
              Critical
            </Badge>
          )}
          {!isCritical && showSeverityBadge && event.severity === 'important' && (
            <Badge variant="outline" className="text-[10px]">Important</Badge>
          )}

          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-label={expanded ? 'Hide details' : 'Show details'}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground sm:h-8 sm:w-8"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/* Mobile puts time and amount under the message instead of beside it. */}
      <div className="mt-1 flex items-center gap-3 pl-11 text-xs text-muted-foreground sm:hidden">
        <span title={absolute}>{relativeTime(event.createdAt)}</span>
        {event.amount !== null && (
          <span className="font-medium text-foreground">
            {formatMoney(event.amount, event.currency)}
          </span>
        )}
      </div>

      {expanded && <ActivityDetailPanel event={event} />}
    </div>
  );
}
