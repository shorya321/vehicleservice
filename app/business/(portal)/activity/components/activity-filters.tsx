'use client';

/**
 * Activity filter bar.
 * SCOPE: Business module ONLY.
 *
 * Two tiers: category chips, search and a date range are always visible; actor
 * and severity sit behind "More filters", matching the showAdvanced pattern in
 * the wallet transaction filters.
 */

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// The portal copy: its trigger matches Input styling, the shared one does not.
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
} from '@/lib/business/activity/catalog';
import type { ActivityCategory } from '@/lib/business/activity/types';

export type RangeKey = '24h' | '7d' | '30d' | '90d' | 'all';

export interface ActivityFilterState {
  categories: ActivityCategory[];
  severity: 'all' | 'important' | 'critical';
  actor: string;
  search: string;
  range: RangeKey;
}

interface TeamMemberOption {
  id: string;
  label: string;
}

interface ActivityFiltersProps {
  value: ActivityFilterState;
  counts: Record<string, number>;
  members: TeamMemberOption[];
  onChange: (next: ActivityFilterState) => void;
}

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All' },
];

export function ActivityFilters({ value, counts, members, onChange }: ActivityFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchDraft, setSearchDraft] = useState(value.search);

  // Debounced: the wallet transaction filters admit they skipped this, and this
  // table is larger.
  useEffect(() => {
    if (searchDraft === value.search) return;
    const timer = setTimeout(() => onChange({ ...value, search: searchDraft }), 300);
    return () => clearTimeout(timer);
  }, [searchDraft, value, onChange]);

  const hasFilters =
    value.categories.length > 0 ||
    value.severity !== 'all' ||
    value.actor !== 'any' ||
    value.search.length > 0 ||
    value.range !== '30d';

  function toggleCategory(category: ActivityCategory) {
    const next = value.categories.includes(category)
      ? value.categories.filter((entry) => entry !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  }

  function clearAll() {
    setSearchDraft('');
    onChange({ categories: [], severity: 'all', actor: 'any', search: '', range: '30d' });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => onChange({ ...value, categories: [] })}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                value.categories.length === 0
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            {ACTIVITY_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  value.categories.includes(category)
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {ACTIVITY_CATEGORY_LABELS[category]}
                {counts[category] ? (
                  <span className="ml-1 text-muted-foreground">{counts[category]}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by person, reference or action"
              className="pl-9"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-muted/50 p-1">
            {RANGES.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => onChange({ ...value, range: range.key })}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  value.range === range.key
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setShowAdvanced((open) => !open)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            More filters
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={clearAll}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Who
              </label>
              <Select
                value={value.actor}
                onValueChange={(actor) => onChange({ ...value, actor })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Anyone</SelectItem>
                  <SelectItem value="me">Me</SelectItem>
                  <SelectItem value="type:admin">Platform admin</SelectItem>
                  <SelectItem value="type:vendor">Vendors</SelectItem>
                  <SelectItem value="type:system">System and Stripe</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Importance
              </label>
              <Select
                value={value.severity}
                onValueChange={(severity) =>
                  onChange({ ...value, severity: severity as ActivityFilterState['severity'] })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everything</SelectItem>
                  <SelectItem value="important">Important and above</SelectItem>
                  <SelectItem value="critical">Critical only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
