/**
 * Quotation detail — the INTERNAL view.
 *
 * Unlike the PDF, this page deliberately shows net cost and margin: it is the business's own
 * screen, and the whole point of the markup model is that they can see what they are making.
 * The customer-facing document is built by a separate module that cannot access those columns.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, EyeOff, FileText, MapPin, Pencil, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { bookingToday } from '@/lib/utils/timezone';
// Portal money format ("AED 150.00"), matching bookings and wallet. The PDF keeps its own.
import { formatCurrency } from '@/lib/business/wallet-operations';
import { Button } from '@/components/ui/button';
import { PortalSectionCard } from '@/app/business/(portal)/components/ui/section-card';
import { PageHeader } from '@/app/business/(portal)/components/ui/page-header';
import { Separator } from '@/components/ui/separator';
// Business empty state — the shared one paints text-luxury-pearl over bg-luxury-gold/10, which
// is the public site's palette and unreadable on the portal's light theme.
import { EmptyState } from '@/components/business/ui/empty-state';
import {
  displayStatus,
  normalizeQuotationStatus,
  canEditHeader,
  canConvert,
} from '@/lib/business/quotations/status';
import { quotationTotals } from '@/lib/business/quotations/pricing';
import { getQuotation } from '../actions';
import { QuotationStatusBadge } from '../components/quotation-status-badge';
import { QuotationActions } from './components/quotation-actions';
import { ConvertDialog } from './components/convert-dialog';

export const metadata: Metadata = {
  title: 'Quotation | Business Portal',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso))
    : '—';

export default async function QuotationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/business/login');

  const member = await getBusinessMember(supabase, user.id);
  if (!member) redirect('/business/login');

  // Returns null for a foreign or missing id alike, so ids cannot be probed.
  const quotation = await getQuotation(id);
  if (!quotation) notFound();

  const status = normalizeQuotationStatus(quotation.status);
  const currency = quotation.currency;
  const rate = Number(quotation.exchange_rate) || 1;
  const editable = canEditHeader(status);
  // Gate unchanged — only the button hierarchy below reads it.
  const showConvert = canConvert(status) && quotation.items.length > 0;

  const totals = quotationTotals(
    quotation.items.map((item) => ({
      net_total_aed: Number(item.net_total_aed),
      sell_total_aed: Number(item.sell_total_aed),
      price_mode: item.price_mode as 'inherited' | 'markup' | 'manual',
      markup_percent: item.markup_percent === null ? null : Number(item.markup_percent),
    })),
    Number(quotation.discount_aed),
    Number(quotation.default_markup_pct)
  );

  const inCurrency = (aed: number) => formatCurrency(aed * rate, currency);
  const displayed = displayStatus(status, quotation.valid_until, bookingToday());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation Details"
        breadcrumb={
          /* Breadcrumb, matching the booking detail page. */
          <nav className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/business/quotations"
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Quotations</span>
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">{quotation.quotation_number}</span>
          </nav>
        }
        actions={
          <>
            {showConvert && <ConvertDialog quotationId={quotation.id} />}
            {editable && (
              <Button asChild variant="outline">
                <Link href={`/business/quotations/${quotation.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {quotation.items.length === 0 ? 'Add trips' : 'Edit trips'}
                </Link>
              </Button>
            )}
            {/* One primary per screen: Convert leads when it is offered, otherwise Download
                does. Three filled buttons side by side told the user nothing about which
                action mattered. */}
            <QuotationActions
              quotationId={quotation.id}
              quotationNumber={quotation.quotation_number}
              status={status}
              hasTrips={quotation.items.length > 0}
              canEdit={editable}
              downloadVariant={showConvert ? 'outline' : 'default'}
            />
          </>
        }
      />

      {/* Status hero — the one line that answers "where is this quotation?" without reading on. */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <QuotationStatusBadge status={displayed} />
              <span className="font-semibold text-foreground">
                {quotation.quotation_number}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {quotation.customer_name}
              {quotation.customer_company ? ` · ${quotation.customer_company}` : ''}
              {quotation.valid_until ? ` · valid until ${fmtDate(quotation.valid_until)}` : ''}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="whitespace-nowrap text-2xl font-bold tabular-nums text-primary">
            {inCurrency(totals.totalSellAed)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <PortalSectionCard title="Itinerary" icon={MapPin} bodyClassName="space-y-3 p-5">
            {quotation.items.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-8 w-8" />}
                title="No trips yet"
                description="A quotation needs at least one trip before it can be turned into a PDF."
              />
            ) : (
              quotation.items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 break-words">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Trip {index + 1}
                        {item.converted_booking_number
                          ? ` · booked as ${item.converted_booking_number}`
                          : ''}
                      </div>
                      {/* Two lines rather than one crammed run: addresses here are full
                          postal strings and read as noise when joined. */}
                      <div className="mt-1 font-medium">{item.pickup_address}</div>
                      <div className="text-muted-foreground">→ {item.dropoff_address}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.pickup_datetime
                          ? fmtDate(item.pickup_datetime)
                          : 'Date to be confirmed'}{' '}
                        · {item.passenger_count} guest
                        {item.passenger_count === 1 ? '' : 's'}
                      </div>
                      {item.addons.length > 0 && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Includes: {item.addons.map((a) => a.name_snapshot).join(', ')}
                        </div>
                      )}
                    </div>
                    {/* nowrap + shrink-0: without it the price broke across three lines. */}
                    <div className="shrink-0 whitespace-nowrap text-right">
                      <div className="font-semibold tabular-nums">
                        {inCurrency(Number(item.sell_total_aed))}
                      </div>
                      {/* Internal — never reaches the PDF. */}
                      <div className="text-xs text-muted-foreground tabular-nums">
                        cost {formatCurrency(Number(item.net_total_aed), 'AED')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </PortalSectionCard>
        </div>

        <div className="space-y-4">
          <PortalSectionCard title="Totals" icon={Receipt} bodyClassName="space-y-2 p-5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="whitespace-nowrap tabular-nums">
                {inCurrency(totals.subtotalSellAed)}
              </span>
            </div>
            {totals.discountAed > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Discount</span>
                <span className="whitespace-nowrap tabular-nums">
                  -{inCurrency(totals.discountAed)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between gap-3 text-base font-semibold">
              <span>Total</span>
              <span className="whitespace-nowrap tabular-nums">
                {inCurrency(totals.totalSellAed)}
              </span>
            </div>

            {/* Internal block. Deliberately visually separated and labelled, because
                everything above it is what the customer sees and everything in it is not. */}
            <div className="mt-4 rounded-md border border-dashed border-border p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <EyeOff className="h-3.5 w-3.5 shrink-0" />
                Internal — not shown to the customer
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Total cost</span>
                <span className="whitespace-nowrap tabular-nums">
                  {formatCurrency(totals.subtotalNetAed, 'AED')}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Margin</span>
                <span className="whitespace-nowrap tabular-nums">
                  {formatCurrency(totals.marginAed, 'AED')}
                  {totals.marginPct !== null ? ` (${totals.marginPct}%)` : ''}
                </span>
              </div>
            </div>

            {currency !== 'AED' && (
              <p className="pt-2 text-xs text-muted-foreground">
                Quoted in {currency} at a rate locked on {fmtDate(quotation.created_at)}.
              </p>
            )}
          </PortalSectionCard>
        </div>
      </div>
    </div>
  );
}
