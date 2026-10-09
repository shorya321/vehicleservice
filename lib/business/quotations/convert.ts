/**
 * Quotation -> bookings conversion.
 *
 * The two things that make this safe:
 *
 * 1. IDEMPOTENCY. Each trip carries a stable `conversion_nonce`, written to
 *    business_bookings.price_signature_nonce, which has a partial UNIQUE index. A duplicate
 *    conversion therefore fails AT THE DATABASE. Because deduct_from_wallet runs before the
 *    INSERT inside the same plpgsql transaction and re-raises on error, that failure rolls
 *    the wallet debit back too. Without this, a request that times out AFTER the RPC commits
 *    but BEFORE we stamp converted_booking_id would double-charge on retry.
 *
 * 2. PREFLIGHT. Every trip is re-priced and every wallet rule checked BEFORE any booking is
 *    created. Price signatures expire after 30 minutes, so the stored net is only ever an
 *    estimate; and deduct_from_wallet enforces three spending limits, so checking the balance
 *    alone would strand a quotation half-converted partway down the loop.
 */

import { startOfBookingDayUtc, startOfBookingMonthUtc } from "@/lib/business/utils/timezone";
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateBusinessBookingPrice } from '@/lib/business/price-calculation';
import { roundAed } from './pricing';
import { missingConversionContact } from './status';
import type { VehicleSelections } from './schema';
import type {
  QuotationRepriceChoice,
  QuotationRepriceLine,
  QuotationPreflightResult,
} from './types';

/**
 * Minimum lead time for a NEW booking, matching the wizard
 * (app/business/(portal)/bookings/new/components/route-step.tsx:120). A quote converting to a
 * pickup ten minutes out is operationally impossible, so it is refused up front.
 */
const MIN_LEAD_HOURS = 2;

/** Postgres unique_violation. How a duplicate conversion attempt announces itself. */
export const UNIQUE_VIOLATION = '23505';

export interface ConvertibleItem {
  id: string;
  from_location_id: string;
  to_location_id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string | null;
  vehicle_type_id: string;
  passenger_count: number;
  adults: number;
  children: number;
  infants: number;
  net_total_aed: number;
  sell_total_aed: number;
  conversion_nonce: string;
  converted_booking_id: string | null;
  /**
   * Prices are deliberately NOT carried: conversion re-prices from the live addons table.
   * `child_ages` IS carried. It is data the operator needs, not a price, and there is nowhere
   * else for it to come from once the quotation row is left behind.
   */
  addons: Array<{ addon_id: string; quantity: number; child_ages: number[] | null }>;
  /** Alternatives offered on this trip. Absent or empty on a trip without any. */
  vehicle_options?: Array<{ vehicle_type_id: string; net_total_aed: number; sell_total_aed: number }>;
}

export interface ConvertibleQuotation {
  id: string;
  quotation_number: string;
  business_account_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
}

/**
 * Bind a confirmation to the exact figures the user was shown.
 *
 * A bare `confirm: true` would let prices move between the diff and the confirm, so the
 * business could buy at a price they never saw. The token is recomputed from a fresh calc at
 * confirm time and must still match.
 */
export function repriceToken(
  quotationId: string,
  lines: QuotationRepriceLine[],
  selections: VehicleSelections = {}
): string {
  // A chosen alternative is bound into the token, so switching vehicle after review forces a
  // fresh one. Only when there IS a choice: a trip on its quoted vehicle hashes exactly as it
  // always has.
  const payload = lines
    .map((line) => {
      const chosen = selections[line.itemId];
      return `${line.itemId}:${line.netAedFresh.toFixed(2)}${chosen ? `:${chosen}` : ''}`;
    })
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(`${quotationId}|${payload}`).digest('hex');
}

/**
 * Keep only the selections that actually change something: a pending trip switched to a
 * vehicle other than its quoted one. Selections for unknown or already-booked trips, or for
 * the quoted vehicle itself, are dropped, so a request that picks nothing new converts exactly
 * as one that sent no selections at all. Whether the vehicle is really offered is checked in
 * preflight, which turns a bad pick into a blocking error.
 */
export function effectiveSelections(
  items: ConvertibleItem[],
  raw: VehicleSelections | undefined
): VehicleSelections {
  if (!raw) return {};
  const result: VehicleSelections = {};
  for (const item of items) {
    const chosen = raw[item.id];
    if (!chosen || item.converted_booking_id || chosen === item.vehicle_type_id) continue;
    result[item.id] = chosen;
  }
  return result;
}

/** Re-price one trip as if it used `vehicleTypeId`. */
function priceTripWith(supabase: SupabaseClient, item: ConvertibleItem, vehicleTypeId: string) {
  return calculateBusinessBookingPrice(supabase, {
    fromLocationId: item.from_location_id,
    toLocationId: item.to_location_id,
    vehicleTypeId,
    passengerCount: item.passenger_count,
    selectedAddons: item.addons.map((a) => ({
      addon_id: a.addon_id,
      quantity: a.quantity,
      child_ages: a.child_ages ?? undefined,
    })),
    children: item.children,
    infants: item.infants,
  });
}

/**
 * Every vehicle a trip offers, priced fresh for the convert dialog, the quoted one first.
 * Only called for a trip that has alternatives.
 */
async function priceChoices(
  supabase: SupabaseClient,
  item: ConvertibleItem,
  vehicleNames: Record<string, string>
): Promise<QuotationRepriceChoice[]> {
  const candidates = [
    { vehicleTypeId: item.vehicle_type_id, sellAed: roundAed(item.sell_total_aed), quoted: true },
    ...(item.vehicle_options ?? []).map((o) => ({
      vehicleTypeId: o.vehicle_type_id,
      sellAed: roundAed(o.sell_total_aed),
      quoted: false,
    })),
  ];

  return Promise.all(
    candidates.map(async (candidate) => {
      const priced = await priceTripWith(supabase, item, candidate.vehicleTypeId);
      const name = vehicleNames[candidate.vehicleTypeId] ?? 'Vehicle';
      return 'error' in priced
        ? { ...candidate, name, netAedFresh: null, error: priced.error }
        : { ...candidate, name, netAedFresh: roundAed(priced.totalPrice) };
    })
  );
}

/**
 * Dry-run the whole conversion. Creates nothing.
 *
 * Turns partial failure from an expected outcome into an infrastructure-only one. It is not a
 * reservation (deduct_from_wallet holds its FOR UPDATE only for its own call) but it closes
 * every deterministic failure.
 */
export async function preflightConversion(
  supabase: SupabaseClient,
  quotation: ConvertibleQuotation,
  items: ConvertibleItem[],
  /** Already passed through effectiveSelections(). Empty means every trip on its quoted vehicle. */
  selections: VehicleSelections = {},
  /** Names for the vehicle choices shown in the dialog. Only read for trips with options. */
  vehicleNames: Record<string, string> = {}
): Promise<QuotationPreflightResult> {
  const blockingErrors: string[] = [];
  const lines: QuotationRepriceLine[] = [];

  const pending = items.filter((item) => !item.converted_booking_id);

  if (pending.length === 0) {
    return {
      ok: false,
      lines: [],
      repriceToken: '',
      totalNetAed: 0,
      blockingErrors: ['Every trip on this quotation has already been booked'],
    };
  }

  // bookingCreationSchema requires both, but a quotation may legitimately be saved without
  // them. An offline quote often starts from a name alone. The edit page's customer card is
  // where a business fixes this; the detail page warns before they get here.
  blockingErrors.push(
    ...missingConversionContact(quotation.customer_email, quotation.customer_phone)
  );

  const earliest = new Date(Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000);
  let totalNetAed = 0;

  for (const item of pending) {
    const label = `${item.pickup_address} » ${item.dropoff_address}`;
    let error: string | undefined;

    if (!item.pickup_datetime) {
      error = 'This trip has no pickup date';
    } else if (new Date(item.pickup_datetime) < earliest) {
      error = `Pickup must be at least ${MIN_LEAD_HOURS} hours from now`;
    }

    // The vehicle this trip will be booked with: the customer's pick when one was made,
    // otherwise the quoted vehicle, exactly as before options existed.
    const chosen = selections[item.id];
    const chosenOption = chosen
      ? (item.vehicle_options ?? []).find((o) => o.vehicle_type_id === chosen)
      : undefined;
    if (chosen && !chosenOption) {
      error = error ?? 'The chosen vehicle is not offered on this trip';
    }
    const vehicleTypeId = chosenOption ? chosenOption.vehicle_type_id : item.vehicle_type_id;
    const sellAed = roundAed(chosenOption ? chosenOption.sell_total_aed : item.sell_total_aed);
    // Compared against the fresh cost to flag a moved price, so it must be the CHOSEN
    // vehicle's stored cost, or picking another vehicle would read as a price change.
    const netAedStored = roundAed(chosenOption ? chosenOption.net_total_aed : item.net_total_aed);

    // Present only on a trip that offers alternatives; a plain trip's line is unchanged.
    const choiceFields =
      (item.vehicle_options?.length ?? 0) > 0
        ? { vehicleTypeId, choices: await priceChoices(supabase, item, vehicleNames) }
        : {};

    // Re-price regardless of the date problem, so the user sees every issue at once rather
    // than fixing them one failed attempt at a time.
    const priced = await priceTripWith(supabase, item, vehicleTypeId);

    if ('error' in priced) {
      // Covers a deactivated zone price, an inactive or shrunken vehicle, and a deactivated
      // or deleted addon. All of which can happen while a quotation sits unanswered.
      error = error ?? priced.error;
      lines.push({
        itemId: item.id,
        label,
        pickup: item.pickup_address,
        dropoff: item.dropoff_address,
        netAedStored,
        netAedFresh: netAedStored,
        sellAed,
        belowCost: false,
        error,
        ...choiceFields,
      });
      blockingErrors.push(`${label}: ${error}`);
      continue;
    }

    const netAedFresh = roundAed(priced.totalPrice);
    totalNetAed = roundAed(totalNetAed + netAedFresh);

    if (error) blockingErrors.push(`${label}: ${error}`);

    lines.push({
      itemId: item.id,
      label,
      pickup: item.pickup_address,
      dropoff: item.dropoff_address,
      netAedStored,
      netAedFresh,
      // The number the business actually cares about: has cost overtaken what we quoted?
      belowCost: netAedFresh > sellAed,
      error,
      sellAed,
      ...choiceFields,
    });
  }

  const walletError = await checkWallet(supabase, quotation.business_account_id, totalNetAed);
  if (walletError) blockingErrors.push(walletError);

  return {
    ok: blockingErrors.length === 0,
    lines,
    repriceToken: repriceToken(quotation.id, lines, selections),
    totalNetAed,
    blockingErrors,
  };
}

/**
 * Every rule deduct_from_wallet enforces, checked against the TOTAL rather than per booking.
 *
 * The per-transaction cap deserves care: conversion creates N separate deductions, each of
 * which would individually pass a cap the whole itinerary blows through. Enforcing the sum
 * here closes that hole deliberately rather than by accident.
 */
async function checkWallet(
  supabase: SupabaseClient,
  businessAccountId: string,
  totalNetAed: number
): Promise<string | null> {
  const { data: account } = await supabase
    .from('business_accounts')
    .select(
      'wallet_balance, wallet_frozen, spending_limits_enabled, max_transaction_amount, max_daily_spend, max_monthly_spend'
    )
    .eq('id', businessAccountId)
    .single();

  if (!account) return 'Business account not found';
  if (account.wallet_frozen) return 'Your wallet is frozen. Please contact support.';

  if (Number(account.wallet_balance) < totalNetAed) {
    return `Insufficient wallet balance. This conversion needs AED ${totalNetAed.toFixed(2)}.`;
  }

  if (!account.spending_limits_enabled) return null;

  if (
    account.max_transaction_amount !== null &&
    totalNetAed > Number(account.max_transaction_amount)
  ) {
    return `This conversion totals AED ${totalNetAed.toFixed(2)}, above your per-transaction limit of AED ${Number(account.max_transaction_amount).toFixed(2)}.`;
  }

  // The same boundaries deduct_from_wallet enforces, which resolve through
  // platform_timezone() in SQL. Local Date constructors gave a server-local day
  // and month, so this pre-flight check and the database check disagreed for
  // the first four hours of every day: a conversion could pass here and then be
  // rejected by the deduction, or the reverse.
  const startOfDay = startOfBookingDayUtc().toISOString();
  const startOfMonth = startOfBookingMonthUtc().toISOString();

  if (account.max_daily_spend !== null) {
    const spent = await spendSince(supabase, businessAccountId, startOfDay);
    if (spent + totalNetAed > Number(account.max_daily_spend)) {
      return `This conversion would exceed your daily spending limit of AED ${Number(account.max_daily_spend).toFixed(2)}.`;
    }
  }

  if (account.max_monthly_spend !== null) {
    const spent = await spendSince(supabase, businessAccountId, startOfMonth);
    if (spent + totalNetAed > Number(account.max_monthly_spend)) {
      return `This conversion would exceed your monthly spending limit of AED ${Number(account.max_monthly_spend).toFixed(2)}.`;
    }
  }

  return null;
}

/** Debits since a boundary. Mirrors deduct_from_wallet's own `amount < 0` accounting. */
async function spendSince(
  supabase: SupabaseClient,
  businessAccountId: string,
  since: string
): Promise<number> {
  const { data } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('business_account_id', businessAccountId)
    .lt('amount', 0)
    .gte('created_at', since);

  return (data ?? []).reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0);
}
