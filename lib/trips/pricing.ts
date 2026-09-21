import type { LegQuote, TripQuote } from './types'

/**
 * Pure money arithmetic for trip types. Everything is done in integer cents so
 * the legs of a group always add up to exactly what Stripe charges: the
 * finalizer rejects a payment whose amount differs by a single cent.
 *
 * Database lookups (zone fares, hourly packages) live in `pricing-server.ts`.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function roundMoney(amount: number): number {
  return fromCents(toCents(amount))
}

export interface LegPriceInput {
  /** Base fare of the leg, already multiplied by the vehicle type multiplier. */
  baseFare: number
  /** Verified add-ons for this leg. Never discounted. */
  addons?: number
}

/**
 * Prices a round trip or multi-city trip.
 *
 * The discount applies to base fares only and is split across legs in
 * proportion to their fares, each share rounded down to the cent. Whatever
 * cents rounding leaves over go on the first leg, so the leg discounts sum to
 * the group discount exactly.
 */
export function quoteTrip(legs: LegPriceInput[], discountPercent: number): TripQuote {
  if (legs.length === 0) throw new Error('A trip needs at least one leg')

  const pct = Math.min(Math.max(discountPercent, 0), 100)
  const baseCents = legs.map((leg) => toCents(leg.baseFare))
  const addonCents = legs.map((leg) => toCents(leg.addons ?? 0))
  const totalBaseCents = baseCents.reduce((sum, cents) => sum + cents, 0)

  const groupDiscountCents = Math.round((totalBaseCents * pct) / 100)
  const shares = baseCents.map((cents) => Math.floor((cents * pct) / 100))
  const remainder = groupDiscountCents - shares.reduce((sum, cents) => sum + cents, 0)
  shares[0] += remainder

  const legQuotes: LegQuote[] = baseCents.map((cents, index) => ({
    base: fromCents(cents),
    discount: fromCents(shares[index]),
    total: fromCents(cents - shares[index] + addonCents[index]),
  }))

  const subtotalCents = totalBaseCents + addonCents.reduce((sum, cents) => sum + cents, 0)

  return {
    legs: legQuotes,
    subtotal: fromCents(subtotalCents),
    discountPercent: pct,
    discount: fromCents(groupDiscountCents),
    total: fromCents(subtotalCents - groupDiscountCents),
  }
}

export interface LegForRefund {
  /** What this leg carries of the group charge (`bookings.total_price`). */
  total: number
  /** This leg's share of the group discount (`bookings.discount_amount`). */
  discount: number
  /** Already cancelled before this one. */
  cancelled: boolean
  /** Refund already recorded for this leg when it was cancelled (`bookings.refund_due`). */
  refundDue: number | null
}

/**
 * Refund owed when one leg of a paid group is cancelled.
 *
 * The group discount was given for travelling every leg, so once any leg is
 * cancelled the legs still running are re-priced at their undiscounted fare.
 * The refund is what was paid, less what the remaining legs now cost, less
 * whatever earlier cancellations already refunded. It is never negative.
 *
 * Example, 10% off a 100 + 100 round trip (paid 180): cancelling the outbound
 * refunds 180 - 100 = 80; cancelling the return afterwards refunds the last 100.
 */
export function cancellationRefundDue(legs: LegForRefund[], cancelledIndex: number): number {
  const target = legs[cancelledIndex]
  if (!target || target.cancelled) return 0

  const paidCents = legs.reduce((sum, leg) => sum + toCents(leg.total), 0)
  const alreadyRefundedCents = legs.reduce(
    (sum, leg) => sum + (leg.cancelled ? toCents(leg.refundDue ?? 0) : 0),
    0
  )
  const stillOwedCents = legs.reduce((sum, leg, index) => {
    if (leg.cancelled || index === cancelledIndex) return sum
    return sum + toCents(leg.total) + toCents(leg.discount)
  }, 0)

  return fromCents(Math.max(paidCents - stillOwedCents - alreadyRefundedCents, 0))
}
