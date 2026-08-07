'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  LuxuryButton,
  LuxuryInput,
  LuxurySelect,
  LuxurySelectContent,
  LuxurySelectItem,
  LuxurySelectTrigger,
  LuxurySelectValue,
  LuxuryTable,
  LuxuryTableBody,
  LuxuryTableCell,
  LuxuryTableHead,
  LuxuryTableHeader,
  LuxuryTableRow,
} from '@/components/business/ui';
import { cn } from '@/lib/utils';
import type { EmailLogEntry } from './types';

interface EmailLogTableProps {
  initialLogs: EmailLogEntry[];
}

const STATUS_STYLES: Record<EmailLogEntry['status'], { label: string; className: string }> = {
  sent: {
    label: 'Sent',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  fell_back: {
    label: 'Sent by us',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
};

export function EmailLogTable({ initialLogs }: EmailLogTableProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialLogs.length >= 25);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(reset: boolean): Promise<void> {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('q', search.trim());
      if (!reset && cursor) params.set('cursor', cursor);

      const response = await fetch(`/api/business/settings/email/logs?${params}`);
      const payload = await response.json();

      if (!response.ok) return;

      const rows: EmailLogEntry[] = payload?.data?.logs ?? [];
      setLogs(reset ? rows : [...logs, ...rows]);
      setCursor(payload?.data?.nextCursor ?? null);
      setHasMore(Boolean(payload?.data?.hasMore));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-2">
          <label htmlFor="log-search" className="text-sm font-medium">
            Search
          </label>
          <LuxuryInput
            id="log-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(true);
            }}
            placeholder="Recipient or subject"
          />
        </div>

        <div className="w-40 space-y-2">
          <label htmlFor="log-status" className="text-sm font-medium">
            Status
          </label>
          <LuxurySelect value={status} onValueChange={setStatus}>
            <LuxurySelectTrigger id="log-status">
              <LuxurySelectValue />
            </LuxurySelectTrigger>
            <LuxurySelectContent>
              <LuxurySelectItem value="all">All</LuxurySelectItem>
              <LuxurySelectItem value="sent">Sent</LuxurySelectItem>
              <LuxurySelectItem value="failed">Failed</LuxurySelectItem>
              <LuxurySelectItem value="fell_back">Sent by us</LuxurySelectItem>
            </LuxurySelectContent>
          </LuxurySelect>
        </div>

        <LuxuryButton type="button" variant="outline" onClick={() => void load(true)} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Apply
        </LuxuryButton>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">No emails yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Every message we send on your behalf will be recorded here, whether it was delivered
            through your server or ours.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <LuxuryTable>
            <LuxuryTableHeader>
              <LuxuryTableRow>
                <LuxuryTableHead>When</LuxuryTableHead>
                <LuxuryTableHead>To</LuxuryTableHead>
                <LuxuryTableHead>Subject</LuxuryTableHead>
                <LuxuryTableHead>Route</LuxuryTableHead>
                <LuxuryTableHead>Status</LuxuryTableHead>
              </LuxuryTableRow>
            </LuxuryTableHeader>
            <LuxuryTableBody>
              {logs.map((log) => {
                const badge = STATUS_STYLES[log.status];
                const isOpen = expanded === log.id;

                return (
                  <LuxuryTableRow
                    key={log.id}
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                    className="cursor-pointer"
                  >
                    <LuxuryTableCell className="whitespace-nowrap text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </LuxuryTableCell>
                    <LuxuryTableCell className="text-sm">{log.to_email}</LuxuryTableCell>
                    <LuxuryTableCell className="max-w-[280px] truncate text-sm">
                      {log.subject}
                      {isOpen && (
                        <div className="mt-2 space-y-1 whitespace-normal text-xs text-muted-foreground">
                          <p>From: {log.from_email}</p>
                          {log.smtp_host && <p>Server: {log.smtp_host}</p>}
                          {log.message_id && <p>Message id: {log.message_id}</p>}
                          {typeof log.duration_ms === 'number' && <p>Took: {log.duration_ms}ms</p>}
                          {log.error_message && (
                            <p className="text-red-600 dark:text-red-400">{log.error_message}</p>
                          )}
                        </div>
                      )}
                    </LuxuryTableCell>
                    <LuxuryTableCell className="whitespace-nowrap text-sm">
                      {log.provider === 'business_smtp' ? 'Your server' : 'Platform'}
                    </LuxuryTableCell>
                    <LuxuryTableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </LuxuryTableCell>
                  </LuxuryTableRow>
                );
              })}
            </LuxuryTableBody>
          </LuxuryTable>
        </div>
      )}

      {hasMore && (
        <LuxuryButton type="button" variant="outline" onClick={() => void load(false)} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Load more
        </LuxuryButton>
      )}
    </div>
  );
}
