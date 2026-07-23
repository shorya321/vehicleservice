'use client';

/**
 * Quotation builder — list of trips with a sheet editor per trip.
 *
 * List-first rather than a wizard: the running total stays visible while you work, which is
 * the entire point of quoting several trips together.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Lock,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatAmount } from '@/lib/currency/format';
import { quotationTotals, applyMarkup } from '@/lib/business/quotations/pricing';
import { updateQuotation } from '../../../mutations';
import { TripEditorSheet } from './trip-editor-sheet';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

interface QuotationBuilderProps {
  quotationId: string;
  businessAccountId: string;
  currency: string;
  exchangeRate: number;
  /** Header fields the builder can change; the rest are edited on the detail page. */
  header: {
    customer_name: string;
    customer_company?: string;
    customer_email?: string;
    customer_phone?: string;
    title?: string;
    notes?: string;
    terms?: string;
    valid_until?: string;
    default_markup_pct: number;
    discount_aed: number;
  };
  initialTrips: QuotationTripDraft[];
}

export function QuotationBuilder({
  quotationId,
  businessAccountId,
  currency,
  exchangeRate,
  header,
  initialTrips,
}: QuotationBuilderProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const [trips, setTrips] = useState<QuotationTripDraft[]>(initialTrips);
  const [defaultMarkupPct, setDefaultMarkupPct] = useState(header.default_markup_pct);
  const [discountAed, setDiscountAed] = useState(header.discount_aed);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totals = quotationTotals(
    trips.map((t) => ({
      net_total_aed: t.net_total_aed,
      sell_total_aed: t.sell_total_aed,
      price_mode: t.price_mode,
      markup_percent: t.markup_percent,
    })),
    discountAed,
    defaultMarkupPct
  );

  const inCurrency = (aed: number) => formatAmount(aed * exchangeRate, currency);

  /** A converted trip is immutable — the wallet has been charged and a booking exists. */
  const isLocked = (trip: QuotationTripDraft) => Boolean(trip.converted_booking_id);

  function upsertTrip(trip: QuotationTripDraft) {
    setTrips((current) => {
      if (editingIndex === null) return [...current, { ...trip, sort_order: current.length }];
      const next = [...current];
      next[editingIndex] = trip;
      return next;
    });
  }

  function duplicateTrip(index: number) {
    setTrips((current) => {
      const source = current[index];
      const copy: QuotationTripDraft = {
        ...source,
        id: undefined,
        converted_booking_id: null,
        converted_booking_number: null,
        // Same route a day later is overwhelmingly the common multi-leg case.
        pickup_datetime: source.pickup_datetime
          ? new Date(new Date(source.pickup_datetime).getTime() + 86_400_000).toISOString()
          : null,
      };
      return [...current, { ...copy, sort_order: current.length }];
    });
    toast.success('Trip duplicated');
  }

  function move(index: number, direction: -1 | 1) {
    setTrips((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((t, i) => ({ ...t, sort_order: i }));
    });
  }

  function removeTrip(index: number) {
    setTrips((current) => current.filter((_, i) => i !== index).map((t, i) => ({ ...t, sort_order: i })));
  }

  function handleSave() {
    startSaving(async () => {
      // Converted trips are owned by the server and must not be resubmitted — persist.ts
      // rejects that explicitly rather than silently ignoring it.
      const editable = trips.filter((t) => !isLocked(t));

      const result = await updateQuotation(
        quotationId,
        { ...header, currency, default_markup_pct: defaultMarkupPct, discount_aed: discountAed },
        editable.map((trip, index) => ({
          id: trip.id,
          sort_order: index,
          from_location_id: trip.from_location_id,
          to_location_id: trip.to_location_id,
          pickup_address: trip.pickup_address,
          dropoff_address: trip.dropoff_address,
          pickup_datetime: trip.pickup_datetime,
          vehicle_type_id: trip.vehicle_type_id,
          passenger_count: trip.passenger_count,
          adults: trip.adults,
          children: trip.children,
          infants: trip.infants,
          description: trip.description,
          addons: trip.addons,
          net_base_price_aed: trip.net_base_price_aed,
          net_addons_price_aed: trip.net_addons_price_aed,
          net_total_aed: trip.net_total_aed,
          sell_total_aed:
            trip.price_mode === 'manual'
              ? trip.sell_total_aed
              : applyMarkup(
                  trip.net_total_aed,
                  trip.price_mode === 'markup' ? trip.markup_percent ?? 0 : defaultMarkupPct
                ),
          price_mode: trip.price_mode,
          markup_percent: trip.price_mode === 'markup' ? trip.markup_percent : null,
        }))
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Quotation saved');
      router.push(`/business/quotations/${quotationId}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Trips</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingIndex(null);
                setSheetOpen(true);
              }}
              disabled={trips.length >= 20}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add trip
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {trips.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No trips yet. Add the first one to start pricing.
              </p>
            )}

            {trips.map((trip, index) => {
              const locked = isLocked(trip);
              return (
                <div key={trip.id ?? `new-${index}`} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>TRIP {index + 1}</span>
                        {locked && (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            booked as {trip.converted_booking_number}
                          </span>
                        )}
                        {!trip.pickup_datetime && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <CalendarClock className="h-3 w-3" />
                            undated
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate font-medium">
                        {trip.from_location_name ?? trip.pickup_address} »{' '}
                        {trip.to_location_name ?? trip.dropoff_address}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trip.vehicle_type_name ?? 'Vehicle'} · {trip.passenger_count} guest
                        {trip.passenger_count === 1 ? '' : 's'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold tabular-nums">
                        {inCurrency(
                          trip.price_mode === 'manual'
                            ? trip.sell_total_aed
                            : applyMarkup(
                                trip.net_total_aed,
                                trip.price_mode === 'markup'
                                  ? trip.markup_percent ?? 0
                                  : defaultMarkupPct
                              )
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        cost {formatAmount(trip.net_total_aed, 'AED')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={locked}
                      onClick={() => {
                        setEditingIndex(index);
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateTrip(index)}>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move trip up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move trip down"
                      disabled={index === trips.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove trip"
                      className="text-destructive"
                      disabled={locked}
                      onClick={() => removeTrip(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="default-markup">Default markup %</Label>
              <Input
                id="default-markup"
                type="number"
                step="0.1"
                value={defaultMarkupPct}
                onChange={(e) => setDefaultMarkupPct(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Applies to trips still following the default. Pinned and manual trips are
                unaffected.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="discount">Discount (AED)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discountAed}
                onChange={(e) => setDiscountAed(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
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
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{inCurrency(totals.totalSellAed)}</span>
              </div>
              <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                Internal — cost {formatAmount(totals.subtotalNetAed, 'AED')} · margin{' '}
                {formatAmount(totals.marginAed, 'AED')}
                {totals.marginPct !== null ? ` (${totals.marginPct}%)` : ''}
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save quotation
            </Button>
          </CardContent>
        </Card>
      </div>

      <TripEditorSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        trip={editingIndex === null ? null : trips[editingIndex]}
        businessAccountId={businessAccountId}
        currency={currency}
        exchangeRate={exchangeRate}
        defaultMarkupPct={defaultMarkupPct}
        onSave={upsertTrip}
      />
    </div>
  );
}
