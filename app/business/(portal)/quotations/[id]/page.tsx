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
import { ArrowLeft, EyeOff, MapPin, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { bookingToday } from '@/lib/utils/timezone';
import { formatAmount } from '@/lib/currency/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
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

  const inCurrency = (aed: number) => formatAmount(aed * rate, currency);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/business/quotations" aria-label="Back to quotations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {quotation.quotation_number}
              </h1>
              <QuotationStatusBadge
                status={displayStatus(status, quotation.valid_until, bookingToday())}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {quotation.customer_name}
              {quotation.customer_company ? ` · ${quotation.customer_company}` : ''}
              {quotation.valid_until ? ` · valid until ${fmtDate(quotation.valid_until)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canConvert(status) && quotation.items.length > 0 && (
            <ConvertDialog quotationId={quotation.id} />
          )}
          {editable && (
            <Button asChild variant="outline">
              <Link href={`/business/quotations/${quotation.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {quotation.items.length === 0 ? 'Add trips' : 'Edit trips'}
              </Link>
            </Button>
          )}
          <QuotationActions
            quotationId={quotation.id}
            quotationNumber={quotation.quotation_number}
            status={status}
            hasTrips={quotation.items.length > 0}
            canEdit={editable}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Itinerary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotation.items.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title="No trips yet"
                  description="A quotation needs at least one trip before it can be turned into a PDF."
                />
              ) : (
                quotation.items.map((item, index) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs uppercase text-muted-foreground">
                          Trip {index + 1}
                          {item.converted_booking_number
                            ? ` · booked as ${item.converted_booking_number}`
                            : ''}
                        </div>
                        <div className="mt-1 font-medium">
                          {item.pickup_address} » {item.dropoff_address}
                        </div>
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
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">
                          {inCurrency(Number(item.sell_total_aed))}
                        </div>
                        {/* Internal — never reaches the PDF. */}
                        <div className="text-xs text-muted-foreground tabular-nums">
                          cost {formatAmount(Number(item.net_total_aed), 'AED')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{inCurrency(totals.subtotalSellAed)}</span>
              </div>
              {totals.discountAed > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">-{inCurrency(totals.discountAed)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{inCurrency(totals.totalSellAed)}</span>
              </div>

              {/* Internal block. Deliberately visually separated and labelled, because
                  everything above it is what the customer sees and everything in it is not. */}
              <div className="mt-4 rounded-md border border-dashed p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <EyeOff className="h-3.5 w-3.5" />
                  Internal — not shown to the customer
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total cost</span>
                  <span className="tabular-nums">
                    {formatAmount(totals.subtotalNetAed, 'AED')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margin</span>
                  <span className="tabular-nums">
                    {formatAmount(totals.marginAed, 'AED')}
                    {totals.marginPct !== null ? ` (${totals.marginPct}%)` : ''}
                  </span>
                </div>
              </div>

              {currency !== 'AED' && (
                <p className="pt-2 text-xs text-muted-foreground">
                  Quoted in {currency} at a rate locked on {fmtDate(quotation.created_at)}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
