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
 * SUPERSEDED, and deliberately still here.
 *
 * Business cancellation no longer returns money at all: refunds are a commercial
 * conversation settled by the platform team, not an automatic wallet credit. The
 * cancel route therefore stopped calling this, and `getCancellationEligibility`
 * below decides who may cancel and when.
 *
 * Kept rather than deleted so its test suite keeps running as a regression guard
 * over this module. Do not read it as live policy, and do not wire it back up.
 *
 * How much of a booking's wallet deduction comes back if it is cancelled right now.
 *
 * Two tiers, matching the published policy:
 *   >= 24h before pickup -> 100%
 *   <  24h before pickup ->   0%   (cancellation still permitted; the vendor is released)
 *
 * Settled statuses always return 0 regardless of timing.
 *
 * Deliberately compares two absolute instants, so it is timezone-independent, "24 hours
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
        ? 'No refund. This trip has already been completed.'
        : `No refund. This booking is already ${booking.booking_status}.`
    );
  }

  if (fullRefund <= 0) {
    return none('No refund. Nothing was charged to your wallet for this booking.');
  }

  if (hoursUntilPickup < CANCELLATION_FREE_HOURS) {
    return none(
      `No refund. Cancellations are free up to ${CANCELLATION_FREE_HOURS} hours before pickup, and this booking is inside that window.`
    );
  }

  return {
    refundAmount: fullRefund,
    refundPercent: 100,
    withinFreeWindow: true,
    hoursUntilPickup,
    reason: 'Full refund. This is more than 24 hours before pickup.',
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

/**
 * Statuses a business may cancel from the portal.
 *
 * The same literal that `app/business/(portal)/bookings/[id]/page.tsx` has always
 * used, lifted into a constant so the page and the API cannot drift. Nothing was
 * added or removed: this is not a change in status behaviour.
 *
 * Note what is NOT here, and why it would be useless: `booking_status` is never
 * set to 'assigned' anywhere in the product. Vendor assignment lives entirely in
 * `booking_assignments.status`, so a booking with a driver on it still reads
 * 'confirmed'. Blocking on the status would block nothing, which is exactly why
 * `hasActiveAssignment` is a separate input below.
 */
export const BUSINESS_CANCELLABLE_STATUSES = ['pending', 'confirmed'] as const;

export type BusinessCancellableStatus = (typeof BUSINESS_CANCELLABLE_STATUSES)[number];

export interface CancellationEligibility {
  canCancel: boolean;
  /** Whole minutes left in the grace period. 0 whenever cancelling is refused. */
  minutesRemaining: number;
  /** Shown before the user confirms, and returned as the body of the 403. */
  reason: string;
}

/**
 * Whether a business may cancel this booking itself, right now.
 *
 * Three gates, in this order:
 *
 *   1. the window is open at all         (0 minutes switches the feature off)
 *   2. the booking is not already settled
 *   3. no vendor is assigned to it
 *   4. the grace period since creation has not elapsed
 *
 * Assignment is checked before timing on purpose. A booking that is both assigned
 * and expired should say so - "a vendor is on this" is the useful sentence, and
 * "you are two minutes late" invites the user to try again faster next time when
 * no amount of speed would have helped.
 *
 * Deliberately compares two absolute instants, so it is timezone-independent: a
 * grace period is a duration, not a wall-clock time, and needs no Asia/Dubai
 * conversion. Same reasoning as `getCancellationRefund` above.
 *
 * Pure and sync, taking the window and the assignment flag as arguments rather
 * than reading them, so the API route and the UI derive the SAME answer from one
 * implementation. A client component can do neither a settings read nor a
 * database query, which is why both arrive as inputs.
 */
export function getCancellationEligibility(
  booking: {
    booking_status: string;
    created_at: string;
  },
  opts: {
    /** From site settings. 0 disables business self-cancellation entirely. */
    windowMinutes: number;
    /** A `booking_assignments` row for this booking in 'pending' or 'accepted'. */
    hasActiveAssignment: boolean;
  }
): CancellationEligibility {
  const refuse = (reason: string): CancellationEligibility => ({
    canCancel: false,
    minutesRemaining: 0,
    reason,
  });

  const windowMinutes = Number.isFinite(opts.windowMinutes)
    ? Math.max(0, Math.floor(opts.windowMinutes))
    : 0;

  if (windowMinutes <= 0) {
    return refuse(
      'Bookings cannot be cancelled from the portal. Contact support to cancel this booking.'
    );
  }

  if (
    !BUSINESS_CANCELLABLE_STATUSES.includes(booking.booking_status as BusinessCancellableStatus)
  ) {
    return refuse(`No longer cancellable. This booking is already ${booking.booking_status}.`);
  }

  if (opts.hasActiveAssignment) {
    return refuse(
      'A vehicle has already been assigned to this booking. Contact support to cancel it.'
    );
  }

  // An unreadable created_at fails closed. The alternative - treating it as "just
  // created" - would hand out an unlimited window on exactly the rows whose data
  // is already suspect.
  // The type guard is load-bearing, not defensive noise: parseISO THROWS on a
  // non-string rather than returning an Invalid Date, so checking only for NaN
  // would turn an absent column into a 500.
  if (typeof booking.created_at !== 'string' || booking.created_at === '') {
    return refuse('Contact support to cancel this booking.');
  }

  const createdMs = parseISO(booking.created_at).getTime();

  if (Number.isNaN(createdMs)) {
    return refuse('Contact support to cancel this booking.');
  }

  const minutesElapsed = (Date.now() - createdMs) / (1000 * 60);

  if (minutesElapsed >= windowMinutes) {
    return refuse(
      `The ${windowMinutes}-minute cancellation window for this booking has passed. Contact support to cancel it.`
    );
  }

  // Rounded up: with 30 seconds left, "1 minute" is truer to the user than "0",
  // which reads as though the window has already shut.
  const minutesRemaining = Math.max(1, Math.ceil(windowMinutes - minutesElapsed));

  return {
    canCancel: true,
    minutesRemaining,
    reason: `You can cancel this booking for another ${minutesRemaining} minute${
      minutesRemaining === 1 ? '' : 's'
    }. Cancelling does not return the amount to your wallet.`,
  };
}
