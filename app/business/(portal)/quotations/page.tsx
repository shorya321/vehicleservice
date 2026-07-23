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
import { PageHeader } from '@/app/business/(portal)/components/ui/page-header';
import { getQuotations, getQuotationStats } from './actions';
import { QuotationFilters } from './components/quotation-filters';
import { QuotationStats } from './components/quotation-stats';
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
  // Drives the empty state's copy: "nothing matched" reads very differently from "nothing yet".
  const hasFilters = Boolean(filters.search) || Boolean(filters.status && filters.status !== 'all');

  return (
    <div className="pb-12 space-y-6">
      <PageHeader
        title="Quotations"
        description="Price one or more trips and share a single PDF with your customer."
      />

      <QuotationStats stats={stats} />

      {/* Filters and the primary action share a row, as on the bookings list. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <QuotationFilters className="flex-1" />
        <Button asChild className="gap-2 lg:w-auto">
          <Link href="/business/quotations/new">
            <Plus className="h-4 w-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      {/* Pagination lives inside the table card, as it does on the bookings list. */}
      <QuotationsTable
        rows={result.rows}
        today={today}
        total={result.total}
        page={result.page}
        limit={result.limit}
        hasFilters={hasFilters}
      />
    </div>
  );
}
