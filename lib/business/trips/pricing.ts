/**
 * Money arithmetic for business trips, in integer cents so the journeys of a trip always add
 * up to exactly what the wallet is charged (the RPC refuses a mismatch of one cent).
 * SCOPE: Business module ONLY. Business twin of lib/trips/pricing.ts. Do not de-duplicate.
 */
import type { BusinessLegQuote, BusinessTripQuote } from './types';

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

export interface BusinessLegPriceInput {
  /** Base fare of the journey, already multiplied by the vehicle multiplier. */
  baseFare: number;
  /** Verified add-ons for this journey. Never discounted. */
  addons?: number;
}

/**
 * Prices a round trip or multi-city trip. The discount applies to base fares only, split across
 * journeys in proportion to their fares and rounded down to the cent; the leftover cents go on
 * the first journey, so the shares sum to the trip discount exactly.
 */
export function quoteBusinessTrip(legs: BusinessLegPriceInput[], discountPercent: number): BusinessTripQuote {
  if (legs.length === 0) throw new Error('A trip needs at least one journey');

  const pct = Math.min(Math.max(discountPercent, 0), 100);
  const baseCents = legs.map((leg) => toCents(leg.baseFare));
  const addonCents = legs.map((leg) => toCents(leg.addons ?? 0));
  const totalBaseCents = baseCents.reduce((sum, cents) => sum + cents, 0);

  const tripDiscountCents = Math.round((totalBaseCents * pct) / 100);
  const shares = baseCents.map((cents) => Math.floor((cents * pct) / 100));
  const remainder = tripDiscountCents - shares.reduce((sum, cents) => sum + cents, 0);
  shares[0] += remainder;

  const legQuotes: BusinessLegQuote[] = baseCents.map((cents, index) => ({
    base: fromCents(cents),
    discount: fromCents(shares[index]),
    total: fromCents(cents - shares[index] + addonCents[index]),
  }));

  const subtotalCents = totalBaseCents + addonCents.reduce((sum, cents) => sum + cents, 0);

  return {
    legs: legQuotes,
    subtotal: fromCents(subtotalCents),
    discountPercent: pct,
    discount: fromCents(tripDiscountCents),
    total: fromCents(subtotalCents - tripDiscountCents),
  };
}
