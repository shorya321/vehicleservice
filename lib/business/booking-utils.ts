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
