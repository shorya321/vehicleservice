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

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateBusinessBookingPrice } from '@/lib/business/price-calculation';
import { roundAed } from './pricing';
import type { QuotationRepriceLine, QuotationPreflightResult } from './types';

/**
 * Minimum lead time for a NEW booking, matching the wizard
 * (app/business/(portal)/bookings/new/components/route-step.tsx:120). A quote converting to a
 * pickup ten minutes out is operationally impossible, so it is refused up front.
 */
const MIN_LEAD_HOURS = 2;

/** Postgres unique_violation — how a duplicate conversion attempt announces itself. */
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
  addons: Array<{ addon_id: string; quantity: number }>;
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
export function repriceToken(quotationId: string, lines: QuotationRepriceLine[]): string {
  const payload = lines
    .map((line) => `${line.itemId}:${line.netAedFresh.toFixed(2)}`)
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(`${quotationId}|${payload}`).digest('hex');
}

const PHONE_RE = /^\+?[1-9]\d{1,14}$/;

/**
 * Dry-run the whole conversion. Creates nothing.
 *
 * Turns partial failure from an expected outcome into an infrastructure-only one. It is not a
 * reservation — deduct_from_wallet holds its FOR UPDATE only for its own call — but it closes
 * every deterministic failure.
 */
export async function preflightConversion(
  supabase: SupabaseClient,
  quotation: ConvertibleQuotation,
  items: ConvertibleItem[]
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
  // them — an offline quote often starts from a name alone.
  if (!quotation.customer_email) {
    blockingErrors.push('Add a customer email before converting — bookings require one');
  }
  if (!quotation.customer_phone || !PHONE_RE.test(quotation.customer_phone)) {
    blockingErrors.push('Add a valid customer phone before converting — bookings require one');
  }

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

    // Re-price regardless of the date problem, so the user sees every issue at once rather
    // than fixing them one failed attempt at a time.
    const priced = await calculateBusinessBookingPrice(supabase, {
      fromLocationId: item.from_location_id,
      toLocationId: item.to_location_id,
      vehicleTypeId: item.vehicle_type_id,
      passengerCount: item.passenger_count,
      selectedAddons: item.addons,
    });

    if ('error' in priced) {
      // Covers a deactivated zone price, an inactive or shrunken vehicle, and a deactivated
      // or deleted addon — all of which can happen while a quotation sits unanswered.
      error = error ?? priced.error;
      lines.push({
        itemId: item.id,
        label,
        pickup: item.pickup_address,
        dropoff: item.dropoff_address,
        netAedStored: roundAed(item.net_total_aed),
        netAedFresh: roundAed(item.net_total_aed),
        sellAed: roundAed(item.sell_total_aed),
        belowCost: false,
        error,
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
      netAedStored: roundAed(item.net_total_aed),
      netAedFresh,
      // The number the business actually cares about: has cost overtaken what we quoted?
      belowCost: netAedFresh > roundAed(item.sell_total_aed),
      error,
    sellAed: roundAed(item.sell_total_aed),
    });
  }

  const walletError = await checkWallet(supabase, quotation.business_account_id, totalNetAed);
  if (walletError) blockingErrors.push(walletError);

  return {
    ok: blockingErrors.length === 0,
    lines,
    repriceToken: repriceToken(quotation.id, lines),
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

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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
