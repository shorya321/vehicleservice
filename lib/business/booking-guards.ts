/**
 * Guards on changing or removing a paid business booking, shared by the admin panel and the
 * business portal.
 *
 * Pure: no Supabase, so it unit-tests under the node jest config.
 */

/**
 * Null when an admin may move a business booking from `from` to `to`, else the reason.
 *
 * Cancelled is final: the wallet may already have been refunded for it, and bringing it back
 * would put a refunded trip back on the road. A completed trip happened, so it cannot be
 * cancelled after the fact.
 */
export function businessStatusChangeBlockedReason(from: string | null | undefined, to: string): string | null {
  if (!from || from === to) return null;
  if (from === 'cancelled') return 'A cancelled booking cannot be reopened. Create a new booking instead.';
  if (from === 'completed' && to === 'cancelled') return 'A completed booking cannot be cancelled.';
  return null;
}

interface DeletableBooking {
  booking_status: string | null;
  pickup_datetime: string | null;
}

/**
 * Null when a business booking may be deleted, else the reason.
 *
 * Deleting never moves money, so deleting a live paid booking would take the trip away and
 * keep the charge with no record of a cancellation. Only cancelled or completed bookings, or
 * ones whose pickup has passed, can be deleted.
 */
export function businessDeleteBlockedReason(booking: DeletableBooking, now: Date = new Date()): string | null {
  const status = booking.booking_status ?? '';
  if (status === 'cancelled' || status === 'completed' || status === 'refunded') return null;
  if (booking.pickup_datetime && new Date(booking.pickup_datetime).getTime() < now.getTime()) return null;
  return 'Cancel the booking first. An upcoming booking cannot be deleted.';
}

interface PortalDeletableBooking extends DeletableBooking {
  payment_status: string | null;
  wallet_deduction_amount: number | string | null;
}

/**
 * The business portal's delete rule: the shared one, plus a cancelled booking that was paid and
 * not yet refunded stays until the platform team has reviewed the refund. Deleting it would
 * remove the booking the refund has to be issued against.
 */
export function businessPortalDeleteBlockedReason(booking: PortalDeletableBooking, now: Date = new Date()): string | null {
  const blocked = businessDeleteBlockedReason(booking, now);
  if (blocked) return blocked;
  const paid = Number(booking.wallet_deduction_amount ?? 0);
  if (booking.booking_status === 'cancelled' && booking.payment_status !== 'refunded' && paid > 0) {
    return 'This booking is cancelled and waiting for the platform team to review a refund. It can be deleted once that is done.';
  }
  return null;
}
