import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

/**
 * Pickup times are always expressed as Asia/Dubai wall-clock, independent of
 * where the server runs or where the customer browses from.
 */
export const BOOKING_TIMEZONE = 'Asia/Dubai'

/** Asia/Dubai observes no DST — the offset is permanently +04:00. */
const BOOKING_UTC_OFFSET = '+04:00'

/**
 * Builds the UTC instant for a `yyyy-MM-dd` date and `HH:mm` time interpreted
 * as Dubai wall-clock.
 */
export function bookingWallClockToUtc(date: string, time: string): Date {
  const parsed = new Date(`${date}T${time}:00${BOOKING_UTC_OFFSET}`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid pickup date/time: ${date} ${time}`)
  }

  return parsed
}

/** Wraps a stored ISO timestamp so date-fns `format` renders it as Dubai wall-clock. */
export function toBookingTz(iso: string): TZDate {
  return new TZDate(iso, BOOKING_TIMEZONE)
}

/** Today's date as `yyyy-MM-dd` in the booking timezone (en-CA yields ISO order). */
export function bookingToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Converts a naive `<input type="datetime-local">` value (`yyyy-MM-ddTHH:mm`),
 * read as Dubai wall-clock, into the UTC instant.
 *
 * `new Date(value)` would instead resolve it in the browser's timezone.
 */
export function bookingLocalInputToUtc(value: string): Date {
  const [date, time = ''] = value.split('T')
  return bookingWallClockToUtc(date, time.slice(0, 5))
}

/** Renders a stored ISO instant as a `datetime-local` input value in Dubai wall-clock. */
export function bookingUtcToLocalInput(iso: string): string {
  return format(toBookingTz(iso), "yyyy-MM-dd'T'HH:mm")
}
