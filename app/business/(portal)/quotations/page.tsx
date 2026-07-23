/**
 * Business Quotations
 *
 * Priced proposals covering one or more trips, shared with the customer as a single PDF.
 * No booking exists and no money moves until a quotation is converted.
 *
 * Filtering and pagination are done in SQL by getQuotations — see actions.ts.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { bookingToday } from '@/lib/utils/timezone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getQuotations, getQuotationStats } from './actions';
import { QuotationFilters } from './components/quotation-filters';
import { QuotationsTable } from './components/quotations-table';
import type { QuotationFilters as Filters } from '@/lib/business/quotations/types';

export const metadata: Metadata = {
  title: 'Quotations | Business Portal',
  description: 'Build and share priced proposals with your customers',
};

interface PageProps {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function BusinessQuotationsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/business/login');

  const member = await getBusinessMember(supabase, user.id);
  if (!member) redirect('/business/login');

  const params = await searchParams;
  const page = Number(first(params.page) ?? '1') || 1;

  const filters: Filters = {
    search: first(params.search),
    status: first(params.status) as Filters['status'],
    page,
    limit: 20,
  };

  const [result, stats] = await Promise.all([getQuotations(filters), getQuotationStats()]);

  // Resolved server-side so "expired" is judged in Asia/Dubai, not the viewer's timezone.
  const today = bookingToday();
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.search) next.set('search', filters.search);
    if (filters.status && filters.status !== 'all') next.set('status', filters.status);
    if (target > 1) next.set('page', String(target));
    const query = next.toString();
    return query ? `/business/quotations?${query}` : '/business/quotations';
  };

  const summary = [
    { label: 'Total', value: stats.total },
    { label: 'Draft', value: stats.draft },
    { label: 'Sent', value: stats.sent },
    { label: 'Accepted', value: stats.accepted },
    { label: 'Expired', value: stats.expired },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Price one or more trips and share a single PDF with your customer.
          </p>
        </div>
        <Button asChild>
          <Link href="/business/quotations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <QuotationFilters />

      <QuotationsTable rows={result.rows} today={today} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {result.page} of {totalPages} · {result.total} quotation
            {result.total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button
              asChild={result.page > 1}
              variant="outline"
              size="sm"
              disabled={result.page <= 1}
            >
              {result.page > 1 ? (
                <Link href={buildPageHref(result.page - 1)}>Previous</Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>
            <Button
              asChild={result.page < totalPages}
              variant="outline"
              size="sm"
              disabled={result.page >= totalPages}
            >
              {result.page < totalPages ? (
                <Link href={buildPageHref(result.page + 1)}>Next</Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
