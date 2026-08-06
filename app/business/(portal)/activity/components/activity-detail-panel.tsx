'use client';

/**
 * The expanded state of an activity row.
 * SCOPE: Business module ONLY.
 *
 * Order matters: the before/after diff first (it is the payoff of the whole
 * design), then flat facts, then a context footer. Never a raw JSON dump, which
 * is what app/admin/users/[id]/activity/page.tsx falls back to and exactly what
 * must not face an owner.
 */

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  buildDiffRows,
  buildFactRows,
  buildReferenceList,
} from '@/lib/business/activity/format-details';
import {
  renderActivityMessage,
  activityMessageToText,
} from '@/lib/business/activity/messages';
import type { ActivityEvent } from '@/lib/business/activity/types';

interface ActivityDetailPanelProps {
  event: ActivityEvent;
}

export function ActivityDetailPanel({ event }: ActivityDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  const diffRows = buildDiffRows(event.changes);
  const factRows = buildFactRows(event);
  const { refs, remaining } = buildReferenceList(event);

  const absolute = new Date(event.createdAt).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  async function copyDetails() {
    const lines = [
      activityMessageToText(renderActivityMessage(event)),
      absolute,
      ...diffRows.map((row) => `${row.label}: ${row.before} -> ${row.after}`),
      ...factRows.map((row) => `${row.label}: ${row.value}`),
      `Action: ${event.action}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the details are on screen either way.
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-muted/30 p-4 text-sm">
      {diffRows.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Field</th>
                <th className="pb-2 pr-4 font-medium">Before</th>
                <th className="pb-2 font-medium">After</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((row) => (
                <tr key={row.field} className="border-t border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                  <td className="py-2 pr-4 text-muted-foreground line-through">{row.before}</td>
                  <td className="py-2 font-medium text-foreground">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {factRows.length > 0 && (
        <dl className="mb-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {factRows.map((row) => (
            <div key={row.key} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {refs.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            References
          </p>
          <div className="max-h-40 overflow-y-auto rounded-md border border-border/50 p-2">
            {refs.map((ref) => (
              <p key={ref} className="font-mono text-xs text-muted-foreground">{ref}</p>
            ))}
            {remaining > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">and {remaining} more</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <span>{absolute}</span>
        {/* IP and device only for security rows: on a settings change it is noise. */}
        {event.category === 'security' && event.ipAddress && (
          <span className="font-mono">{event.ipAddress}</span>
        )}
        <Badge variant="outline" className="font-mono text-[10px]">
          {event.action}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1.5 text-xs"
          onClick={copyDetails}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy details'}
        </Button>
      </div>
    </div>
  );
}
