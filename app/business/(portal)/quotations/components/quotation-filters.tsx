'use client';

/**
 * Quotation list filters.
 *
 * State lives in the URL rather than component state, so filtered views are shareable,
 * survive a refresh, and drive the SERVER query — the list is filtered and paginated in SQL,
 * not in JavaScript over a fully-fetched array.
 */

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
} from '@/lib/business/quotations/status';

const SEARCH_DEBOUNCE_MS = 350;

export function QuotationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlSearch = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? 'all';

  const [search, setSearch] = useState(urlSearch);

  // Keep the input in step when the URL changes from elsewhere (back button, Clear).
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const apply = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key);
        else params.set(key, value);
      }
      // Any filter change invalidates the current page offset.
      params.delete('page');
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Debounced so typing does not fire a query per keystroke.
  useEffect(() => {
    if (search === urlSearch) return;
    const timer = setTimeout(() => apply({ search }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, urlSearch, apply]);

  const hasFilters = Boolean(urlSearch) || status !== 'all';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by number, customer or company"
          className="pl-9"
          aria-label="Search quotations"
        />
      </div>

      <Select value={status} onValueChange={(value) => apply({ status: value })}>
        <SelectTrigger className="sm:w-52" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {QUOTATION_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {QUOTATION_STATUS_LABELS[value]}
            </SelectItem>
          ))}
          {/* Derived from valid_until rather than stored, but filterable all the same. */}
          <SelectItem value="expired">{QUOTATION_STATUS_LABELS.expired}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => apply({ search: null, status: null })}
          disabled={isPending}
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
