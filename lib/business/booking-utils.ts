import { differenceInHours, parseISO } from 'date-fns';

/**
 * Number of hours before pickup time when modifications are no longer allowed
 */
export const MODIFICATION_CUTOFF_HOURS = 3;

/**
 * Booking statuses that allow date/time modification
 */
export const MODIFIABLE_STATUSES = ['pending', 'confirmed', 'assigned'] as const;

export type ModifiableStatus = (typeof MODIFIABLE_STATUSES)[number];

/**
 * Check if a booking's date/time can be modified
 * @param booking - The booking to check
 * @returns true if the booking can be modified, false otherwise
 */
export function canModifyBookingDateTime(booking: {
  booking_status: string;
  pickup_datetime: string;
}): boolean {
  // Check if status allows modification
  if (!MODIFIABLE_STATUSES.includes(booking.booking_status as ModifiableStatus)) {
    return false;
  }

  // Check if within time window
  const pickupTime = parseISO(booking.pickup_datetime);
  const now = new Date();
  const hoursUntilPickup = differenceInHours(pickupTime, now);

  return hoursUntilPickup > MODIFICATION_CUTOFF_HOURS;
}

/**
 * Get the cutoff time after which modifications are not allowed
 * @param pickupDatetime - The pickup datetime string (ISO format)
 * @returns The cutoff Date object
 */
export function getModificationCutoffTime(pickupDatetime: string): Date {
  const pickupTime = parseISO(pickupDatetime);
  return new Date(pickupTime.getTime() - MODIFICATION_CUTOFF_HOURS * 60 * 60 * 1000);
}

/**
 * Get the number of hours remaining to modify a booking
 * @param pickupDatetime - The pickup datetime string (ISO format)
 * @returns Number of hours remaining (0 if cutoff has passed)
 */
export function getHoursRemainingToModify(pickupDatetime: string): number {
  const cutoff = getModificationCutoffTime(pickupDatetime);
  const hoursRemaining = differenceInHours(cutoff, new Date());
  return Math.max(0, hoursRemaining);
}

/**
 * Get a human-readable message about modification eligibility
 * @param booking - The booking to check
 * @returns Object with canModify boolean and reason message
 */
export function getModificationEligibility(booking: {
  booking_status: string;
  pickup_datetime: string;
}): { canModify: boolean; reason: string } {
  // Check status first
  if (!MODIFIABLE_STATUSES.includes(booking.booking_status as ModifiableStatus)) {
    return {
      canModify: false,
      reason: `Cannot modify bookings with status "${booking.booking_status}". Only pending, confirmed, or assigned bookings can be modified.`,
    };
  }

  // Check time window
  const hoursRemaining = getHoursRemainingToModify(booking.pickup_datetime);

  if (hoursRemaining <= 0) {
    return {
      canModify: false,
      reason: `Modification window has closed. Bookings can only be modified up to ${MODIFICATION_CUTOFF_HOURS} hours before pickup time.`,
    };
  }

  return {
    canModify: true,
    reason: `You have ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'} remaining to modify this booking.`,
  };
}

/**
 * Free-cancellation window, in hours before pickup.
 *
 * Not an invented number: it is the policy already published to customers in
 * app/contact/components/contact-faq.tsx ("free cancellation up to 24 hours before your
 * scheduled pickup") and already enforced for consumers in app/account/booking-actions.ts.
 * The business module simply never implemented it. It also matches the airport-transfer norm.
 */
export const CANCELLATION_FREE_HOURS = 24;

/**
 * Statuses whose money is already settled and can never be refunded.
 *
 * Mirrors the guard inside the cancel_business_booking_with_refund database function. The
 * important member is 'completed': the trip was delivered, so the money is earned. The delete
 * routes historically omitted it, which would have refunded delivered trips.
 */
export const NON_REFUNDABLE_STATUSES = ['cancelled', 'completed', 'refunded'] as const;

export interface CancellationRefund {
  /** AED, rounded to 2dp to match the numeric(10,2) wallet columns. */
  refundAmount: number;
  refundPercent: 0 | 100;
  withinFreeWindow: boolean;
  /** Fractional hours; negative once pickup has passed. */
  hoursUntilPickup: number;
  /** Customer-facing explanation, shown before the user confirms. */
  reason: string;
}

/**
 * How much of a booking's wallet deduction comes back if it is cancelled right now.
 *
 * Two tiers, matching the published policy:
 *   >= 24h before pickup -> 100%
 *   <  24h before pickup ->   0%   (cancellation still permitted; the vendor is released)
 *
 * Settled statuses always return 0 regardless of timing.
 *
 * Deliberately compares two absolute instants, so it is timezone-independent — "24 hours
 * before pickup" is a duration, not a wall-clock time, and needs no Asia/Dubai conversion.
 *
 * Pure and dependency-light so the API route and the UI derive the SAME number rather than
 * each computing their own.
 */
export function getCancellationRefund(booking: {
  booking_status: string;
  pickup_datetime: string;
  wallet_deduction_amount: number;
}): CancellationRefund {
  const deduction = Number(booking.wallet_deduction_amount) || 0;
  // Round once, here, so callers never re-derive and drift from the stored value.
  const fullRefund = Math.round((deduction + Number.EPSILON) * 100) / 100;

  const pickupMs = parseISO(booking.pickup_datetime).getTime();
  const hoursUntilPickup = Number.isNaN(pickupMs)
    ? 0
    : (pickupMs - Date.now()) / (1000 * 60 * 60);

  const none = (reason: string): CancellationRefund => ({
    refundAmount: 0,
    refundPercent: 0,
    withinFreeWindow: false,
    hoursUntilPickup,
    reason,
  });

  if (
    NON_REFUNDABLE_STATUSES.includes(
      booking.booking_status as (typeof NON_REFUNDABLE_STATUSES)[number]
    )
  ) {
    return none(
      booking.booking_status === 'completed'
        ? 'No refund — this trip has already been completed.'
        : `No refund — this booking is already ${booking.booking_status}.`
    );
  }

  if (fullRefund <= 0) {
    return none('No refund — nothing was charged to your wallet for this booking.');
  }

  if (hoursUntilPickup < CANCELLATION_FREE_HOURS) {
    return none(
      `No refund — cancellations are free up to ${CANCELLATION_FREE_HOURS} hours before pickup, and this booking is inside that window.`
    );
  }

  return {
    refundAmount: fullRefund,
    refundPercent: 100,
    withinFreeWindow: true,
    hoursUntilPickup,
    reason: 'Full refund — this is more than 24 hours before pickup.',
  };
}

/**
 * Validate that a new pickup datetime is valid for modification
 * @param newDatetime - The proposed new pickup datetime
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateNewPickupDatetime(newDatetime: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    const newTime = parseISO(newDatetime);
    const now = new Date();

    // New time must be in the future
    if (newTime <= now) {
      return {
        isValid: false,
        error: 'New pickup time must be in the future.',
      };
    }

    // New time must be at least MODIFICATION_CUTOFF_HOURS in the future
    // to allow for potential further modifications
    const minimumTime = new Date(now.getTime() + MODIFICATION_CUTOFF_HOURS * 60 * 60 * 1000);
    if (newTime < minimumTime) {
      return {
        isValid: false,
        error: `New pickup time must be at least ${MODIFICATION_CUTOFF_HOURS} hours from now.`,
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Invalid datetime format.',
    };
  }
}
