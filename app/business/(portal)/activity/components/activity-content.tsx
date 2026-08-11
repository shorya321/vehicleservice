'use client';

/**
 * Activity page orchestrator: filter state, cursor fetching, export, purge.
 * SCOPE: Business module ONLY.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Eraser, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '../../components/ui/page-header';
import { formatCurrency, convertForDisplay } from '@/lib/business/wallet-operations';
import type { CurrencyCode } from '@/lib/utils/currency-converter';
import type { ActivityEvent } from '@/lib/business/activity/types';
import { ActivityFeed } from './activity-feed';
import { ActivityFilters, type ActivityFilterState } from './activity-filters';
import { ActivityStats, type ActivityStatsData } from './activity-stats';
import { PurgeDialog } from './purge-dialog';

interface TeamMemberOption {
  id: string;
  label: string;
}

interface ActivityContentProps {
  businessName: string;
  displayCurrency: CurrencyCode;
  exchangeRates: Record<string, number>;
  members: TeamMemberOption[];
}

const DEFAULT_FILTERS: ActivityFilterState = {
  categories: [],
  severity: 'all',
  actor: 'any',
  search: '',
  range: '30d',
};

const RANGE_LABELS: Record<ActivityFilterState['range'], string> = {
  '24h': 'in the last 24 hours',
  '7d': 'in the last 7 days',
  '30d': 'in the last 30 days',
  '90d': 'in the last 90 days',
  all: 'all time',
};

function rangeStart(range: ActivityFilterState['range']): string | null {
  if (range === 'all') return null;
  const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

function buildParams(filters: ActivityFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.categories.length) params.set('categories', filters.categories.join(','));
  if (filters.severity === 'critical') params.set('severities', 'critical');
  if (filters.severity === 'important') params.set('severities', 'important,critical');
  if (filters.actor !== 'any') params.set('actor', filters.actor);
  if (filters.search) params.set('search', filters.search);
  const from = rangeStart(filters.range);
  if (from) params.set('from', from);
  return params;
}

export function ActivityContent({
  businessName,
  displayCurrency,
  exchangeRates,
  members,
}: ActivityContentProps) {
  const [filters, setFilters] = useState<ActivityFilterState>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<ActivityStatsData | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Amounts are stored in AED and converted for display, so the feed always
  // agrees with the wallet page rather than contradicting it.
  const formatMoney = useCallback(
    (amount: number, currency: string | null) => {
      // convertForDisplay honours the stored source currency rather than
      // assuming AED: admin_adjust_wallet still stamps USD on some rows.
      const converted = convertForDisplay(
        amount,
        currency || 'AED',
        displayCurrency,
        exchangeRates
      );
      return formatCurrency(converted, displayCurrency);
    },
    [displayCurrency, exchangeRates]
  );

  const params = useMemo(() => buildParams(filters).toString(), [filters]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatsLoading(true);
      try {
        const [feedResponse, statsResponse] = await Promise.all([
          fetch(`/api/business/activity?${params}`),
          fetch(`/api/business/activity/stats?${params}`),
        ]);

        const feedPayload = await feedResponse.json();
        const statsPayload = await statsResponse.json();

        if (cancelled) return;

        setEvents(feedPayload?.data?.events ?? []);
        setCursor(feedPayload?.data?.nextCursor ?? null);
        setHasMore(Boolean(feedPayload?.data?.hasMore));
        setStats(statsPayload?.data ?? null);
      } catch {
        if (!cancelled) {
          setEvents([]);
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setStatsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params, reloadToken]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/business/activity?${params}&cursor=${encodeURIComponent(cursor)}`
      );
      const payload = await response.json();
      setEvents((current) => [...current, ...(payload?.data?.events ?? [])]);
      setCursor(payload?.data?.nextCursor ?? null);
      setHasMore(Boolean(payload?.data?.hasMore));
    } catch {
      // Leave what is already on screen in place.
    } finally {
      setLoadingMore(false);
    }
  }

  const hasFilters =
    filters.categories.length > 0 ||
    filters.severity !== 'all' ||
    filters.actor !== 'any' ||
    filters.search.length > 0;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Activity"
        description="Every action taken in your account, by your team, the platform, and your vendors."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`/api/business/activity/export?${params}`}>
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPurgeOpen(true)}>
                  <Eraser className="mr-2 h-3.5 w-3.5" />
                  Clear history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <ActivityStats
        stats={stats}
        loading={statsLoading}
        rangeLabel={RANGE_LABELS[filters.range]}
        formatMoney={formatMoney}
        onShowCritical={() => setFilters((current) => ({ ...current, severity: 'critical' }))}
        onShowTopActor={(businessUserId) =>
          setFilters((current) => ({ ...current, actor: businessUserId }))
        }
      />

      <ActivityFilters
        value={filters}
        counts={stats?.countsByCategory ?? {}}
        members={members}
        onChange={setFilters}
      />

      <ActivityFeed
        events={events}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        hasFilters={hasFilters}
        showSeverityBadge={filters.severity !== 'all'}
        formatMoney={formatMoney}
        onLoadMore={loadMore}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
      />

      <PurgeDialog
        open={purgeOpen}
        businessName={businessName}
        onOpenChange={setPurgeOpen}
        onPurged={() => setReloadToken((token) => token + 1)}
      />
    </div>
  );
}
