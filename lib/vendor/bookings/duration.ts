import * as z from 'zod'

/**
 * How long an accepted online booking holds its vehicle and driver.
 *
 * The hold is what makes a resource read as "Unavailable" for other bookings. It starts at
 * pickup and runs for this many hours; nothing expires it on a timer, so the window is
 * released only when the booking is completed or cancelled and its `resource_schedules`
 * rows are deleted.
 *
 * This used to be a single fixed 2h estimate. It is now chosen by the vendor and stored on
 * `booking_assignments.estimated_duration_hours`, so a job that runs long can keep its
 * resources instead of freeing them into a double booking.
 *
 * Shared deliberately between the client modals and the server actions, following the
 * `lib/vendor/direct-bookings/schema.ts` precedent. One definition of the limits, so the
 * input and the action cannot drift apart.
 */

export const DEFAULT_TRIP_DURATION_HOURS = 3
export const MIN_TRIP_DURATION_HOURS = 1
export const MAX_TRIP_DURATION_HOURS = 24

/**
 * Whole hours only. Server actions must parse untrusted input through this rather than
 * trusting the number the browser sent. The database CHECK is the last line, not the first.
 */
export const durationHoursSchema = z
  .number({ message: 'Enter how many hours to hold the vehicle and driver' })
  .int('Use whole hours')
  .min(MIN_TRIP_DURATION_HOURS, `Minimum ${MIN_TRIP_DURATION_HOURS} hour`)
  .max(MAX_TRIP_DURATION_HOURS, `Maximum ${MAX_TRIP_DURATION_HOURS} hours`)

/**
 * Validate an incoming duration, falling back to the default when nothing was supplied.
 *
 * `undefined` and `null` mean "caller did not choose" and get the default. A value that was
 * supplied but is out of range throws. Silently clamping it would hold the resources for a
 * period the vendor never agreed to.
 */
export function parseDurationHours(hours?: number | null): number {
  if (hours === undefined || hours === null) return DEFAULT_TRIP_DURATION_HOURS

  const result = durationHoursSchema.safeParse(hours)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Invalid booking duration')
  }

  return result.data
}

/**
 * When the vehicle and driver are released: pickup + the stored duration.
 *
 * Rows written before this feature existed have no stored value; they were backfilled to 2
 * by the migration, so a NULL here means an assignment that was never accepted and the
 * default is the sensible read.
 */
export function tripEndFrom(pickup: Date, hours?: number | null): Date {
  const durationHours = hours ?? DEFAULT_TRIP_DURATION_HOURS
  return new Date(pickup.getTime() + durationHours * 60 * 60 * 1000)
}
