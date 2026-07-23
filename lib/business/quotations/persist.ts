/**
 * Quotation persistence helpers.
 *
 * Kept out of the 'use server' action module so it can export types and synchronous helpers,
 * and so the action file stays thin.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { quotationTotals, roundAed, type QuotationPricedLine } from './pricing';
import type { QuotationTripInput } from './schema';

/** AED-based rates, keyed by target currency, as returned by getExchangeRates(). */
export type RatesMap = Record<string, number>;

/**
 * The AED -> display currency rate to freeze onto the quotation.
 * Falls back to 1 for AED itself or an unknown currency, so a missing rate can never zero out
 * a customer's totals.
 */
export function resolveExchangeRate(currency: string, rates: RatesMap): number {
  if (!currency || currency === 'AED') return 1;
  const rate = rates[currency];
  return typeof rate === 'number' && rate > 0 ? rate : 1;
}

/**
 * Recompute a quotation's stored totals from its lines.
 *
 * The DB enforces total_sell_aed = ROUND(subtotal_sell_aed - discount_aed, 2), so these must
 * be written together and must agree exactly or the write aborts.
 */
export function computeStoredTotals(
  lines: QuotationPricedLine[],
  discountAed: number,
  defaultMarkupPct: number
) {
  const totals = quotationTotals(lines, discountAed, defaultMarkupPct);
  return {
    subtotal_net_aed: totals.subtotalNetAed,
    subtotal_sell_aed: totals.subtotalSellAed,
    discount_aed: totals.discountAed,
    total_sell_aed: totals.totalSellAed,
  };
}

/** The sell price actually stored for a line, honouring its pricing mode. */
export function storedSellPrice(
  trip: QuotationTripInput,
  defaultMarkupPct: number
): number {
  if (trip.price_mode === 'manual') return roundAed(trip.sell_total_aed);
  const pct = trip.price_mode === 'markup' ? trip.markup_percent ?? 0 : defaultMarkupPct;
  return roundAed(roundAed(trip.net_total_aed) * (1 + pct / 100));
}

export interface SaveTripsArgs {
  supabase: SupabaseClient;
  quotationId: string;
  businessAccountId: string;
  trips: QuotationTripInput[];
  defaultMarkupPct: number;
}

/**
 * Replace a quotation's UNCONVERTED trips with the supplied list.
 *
 * Converted trips are never touched: they have a real booking behind them and the FK is
 * RESTRICT, so a delete would fail anyway. Skipping them here means a partially converted
 * quotation stays editable for the trips still under negotiation, which is the whole point of
 * the partially_converted state.
 *
 * Returns every line's pricing so the caller can recompute the header totals in one pass.
 */
export async function saveQuotationTrips({
  supabase,
  quotationId,
  businessAccountId,
  trips,
  defaultMarkupPct,
}: SaveTripsArgs): Promise<{ error?: string; lines: QuotationPricedLine[] }> {
  const { data: existing, error: loadError } = await supabase
    .from('business_quotation_items')
    .select('id, converted_booking_id, net_total_aed, sell_total_aed, price_mode, markup_percent')
    .eq('quotation_id', quotationId);

  if (loadError) {
    return { error: 'Failed to load existing trips', lines: [] };
  }

  const locked = (existing ?? []).filter((row) => row.converted_booking_id);
  const lockedIds = new Set(locked.map((row) => row.id));
  const editableIds = new Set(
    (existing ?? []).filter((row) => !row.converted_booking_id).map((row) => row.id)
  );

  // A converted trip may not be resubmitted for edit. Silently dropping it would look like a
  // successful save that quietly ignored the change.
  if (trips.some((t) => t.id && lockedIds.has(t.id))) {
    return { error: 'A trip that has already been booked cannot be edited', lines: [] };
  }

  const keepIds = new Set(trips.map((t) => t.id).filter(Boolean) as string[]);
  const toDelete = Array.from(editableIds).filter((id) => !keepIds.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('business_quotation_items')
      .delete()
      .in('id', toDelete);
    if (error) return { error: 'Failed to remove trips', lines: [] };
  }

  // Sort order is UNIQUE per quotation. Converted trips keep their existing slots, so new
  // ones are numbered after them to avoid colliding with a row we are not allowed to move.
  const offset = locked.length;

  for (let index = 0; index < trips.length; index += 1) {
    const trip = trips[index];
    const sellPrice = storedSellPrice(trip, defaultMarkupPct);

    const payload = {
      quotation_id: quotationId,
      business_account_id: businessAccountId,
      sort_order: offset + index,
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
      description: trip.description ?? null,
      net_base_price_aed: roundAed(trip.net_base_price_aed),
      net_addons_price_aed: roundAed(trip.net_addons_price_aed),
      net_total_aed: roundAed(trip.net_total_aed),
      net_quoted_at: new Date().toISOString(),
      sell_total_aed: sellPrice,
      price_mode: trip.price_mode,
      markup_percent: trip.price_mode === 'markup' ? trip.markup_percent : null,
    };

    let itemId = trip.id;

    if (itemId && editableIds.has(itemId)) {
      const { error } = await supabase
        .from('business_quotation_items')
        .update(payload)
        .eq('id', itemId);
      if (error) return { error: 'Failed to update a trip', lines: [] };
    } else {
      const { data, error } = await supabase
        .from('business_quotation_items')
        .insert(payload)
        .select('id')
        .single();
      if (error || !data) {
        // The item-cap trigger raises here for the 21st trip.
        return { error: error?.message ?? 'Failed to add a trip', lines: [] };
      }
      itemId = data.id;
    }

    // Addons are replaced wholesale — simpler than diffing, and the child rows carry no
    // state worth preserving beyond the snapshot itself.
    await supabase.from('business_quotation_item_addons').delete().eq('item_id', itemId);

    if (trip.addons.length > 0) {
      const { error } = await supabase.from('business_quotation_item_addons').insert(
        trip.addons.map((addon) => ({
          item_id: itemId,
          addon_id: addon.addon_id,
          name_snapshot: addon.name_snapshot,
          quantity: addon.quantity,
          unit_price: roundAed(addon.unit_price),
          total_price: roundAed(addon.total_price),
        }))
      );
      if (error) return { error: 'Failed to save trip extras', lines: [] };
    }
  }

  // Converted lines still count toward the document total even though they are immutable.
  const lines: QuotationPricedLine[] = [
    ...locked.map((row) => ({
      net_total_aed: Number(row.net_total_aed),
      sell_total_aed: Number(row.sell_total_aed),
      price_mode: row.price_mode as QuotationPricedLine['price_mode'],
      markup_percent: row.markup_percent === null ? null : Number(row.markup_percent),
    })),
    ...trips.map((trip) => ({
      net_total_aed: roundAed(trip.net_total_aed),
      sell_total_aed: storedSellPrice(trip, defaultMarkupPct),
      price_mode: trip.price_mode,
      markup_percent: trip.price_mode === 'markup' ? trip.markup_percent : null,
    })),
  ];

  return { lines };
}
