/**
 * The customer cancellation policy, in one place.
 *
 * Full refund to the original card when a booking is cancelled more than 24 hours before pickup.
 * Inside 24 hours, or a no-show, there is no refund. The cancel button, the server action that
 * enforces it and every line of copy that states it read from here, so the rule and the promise
 * cannot drift apart again.
 *
 * Refunds are issued by hand in Stripe (see app/account/lib/cancellation.ts), which is why the
 * copy promises a timeline rather than an instant refund.
 *
 * Pure module: safe to import from server and client components.
 */

export const FREE_CANCELLATION_HOURS = 24

/** Elapsed time, not wall clock, so it needs no timezone and holds across a DST edge. */
export const FREE_CANCELLATION_WINDOW_MS = FREE_CANCELLATION_HOURS * 60 * 60 * 1000

/** How long a refund takes to reach the card, as promised in copy. */
export const REFUND_TIMELINE = '5 to 10 working days'

export const CANCELLATION_POLICY_PATH = '/refund'

/**
 * Badge on the vehicle cards. Kept short because it shares a row with the category pill at
 * phone width; the full rule goes in its title and in the perks strip above the fleet.
 */
export const FREE_CANCELLATION_BADGE = 'Free cancellation'

/** One sentence for headings, meta descriptions and confirmation pages. */
export const FREE_CANCELLATION_LINE = `Free cancellation up to ${FREE_CANCELLATION_HOURS} hours before pickup.`

/** Shown instead of the free-cancellation promise when pickup is already inside the window. */
export const NON_REFUNDABLE_LINE = `Pickup is within ${FREE_CANCELLATION_HOURS} hours, so this booking is non-refundable.`

type PickupInput = string | Date | null | undefined

function pickupMs(pickup: PickupInput): number | null {
  if (!pickup) return null
  const ms = pickup instanceof Date ? pickup.getTime() : new Date(pickup).getTime()
  return Number.isNaN(ms) ? null : ms
}

/**
 * True when the booking can still be cancelled for a full refund: strictly more than 24 hours
 * before pickup. Exactly 24 hours counts as inside the window.
 */
export function isFreeCancellationAvailable(pickup: PickupInput, now: number = Date.now()): boolean {
  const ms = pickupMs(pickup)
  if (ms === null) return false
  return ms - now > FREE_CANCELLATION_WINDOW_MS
}

/** The instant free cancellation ends, or null when there is no usable pickup time. */
export function freeCancellationDeadline(pickup: PickupInput): Date | null {
  const ms = pickupMs(pickup)
  return ms === null ? null : new Date(ms - FREE_CANCELLATION_WINDOW_MS)
}
