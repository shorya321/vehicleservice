import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

/**
 * Pickup times are always expressed as Asia/Dubai wall-clock, independent of
 * where the server runs or where the customer browses from.
 */
export const BOOKING_TIMEZONE = 'Asia/Dubai'

/** Asia/Dubai observes no DST. The offset is permanently +04:00. */
export const BOOKING_UTC_OFFSET = '+04:00'

/** The same offset in minutes, for arithmetic that cannot use the string form. */
export const BOOKING_UTC_OFFSET_MINUTES = 4 * 60

/**
 * What the display helpers accept.
 *
 * Nullable on purpose: these replace roughly ninety call sites, many of which
 * format a column that is genuinely optional. Returning an empty string beats
 * rendering "Invalid Date" or throwing inside a Server Component.
 */
export type DateInput = string | number | Date | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

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

const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOOKING_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * The Dubai calendar day (`yyyy-MM-dd`) a given instant falls on.
 *
 * Use this for grouping and for "same day?" comparisons. Reading `getDate()`
 * off a Date instead answers the question in the viewer's timezone, so a feed
 * grouped that way shows different day headings to a customer abroad.
 */
export function bookingDayKey(value: DateInput): string {
  const date = toDate(value)
  return date ? DAY_FORMATTER.format(date) : ''
}

/** Today's date as `yyyy-MM-dd` in the booking timezone (en-CA yields ISO order). */
export function bookingToday(): string {
  return DAY_FORMATTER.format(new Date())
}

/**
 * The UTC instant at which today began in Dubai.
 *
 * This is the single boundary for "is this in the past?". Do not reach for
 * `new Date()` + `setHours(0, 0, 0, 0)`: that yields midnight in whatever
 * timezone the process happens to run in (UTC on Vercel), which is 04:00 Dubai
 *, so anything booked in the first four hours of the Dubai day reads as past.
 */
export function startOfBookingDayUtc(): Date {
  return bookingWallClockToUtc(bookingToday(), '00:00')
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

// --- Display ---------------------------------------------------------------
//
// The two-step `format(toBookingTz(iso), pattern)` is easy to half-remember,
// and a call site that forgets the wrapper silently renders in whatever zone
// the viewer or the server happens to be in. These are the spellings to reach
// for instead; nothing outside this file should be calling toLocaleString on a
// stored timestamp.

/** A stored instant as a Dubai date, e.g. `11 Aug 2026`. */
export function formatBookingDate(value: DateInput, pattern = 'dd MMM yyyy'): string {
  const date = toDate(value)
  return date ? format(new TZDate(date, BOOKING_TIMEZONE), pattern) : ''
}

/** A stored instant as a Dubai date and time, e.g. `11 Aug 2026 at 14:32`. */
export function formatBookingDateTime(
  value: DateInput,
  pattern = "dd MMM yyyy 'at' HH:mm"
): string {
  return formatBookingDate(value, pattern)
}

/** A stored instant as a Dubai time of day, e.g. `14:32`. */
export function formatBookingTime(value: DateInput, pattern = 'HH:mm'): string {
  return formatBookingDate(value, pattern)
}

/**
 * "just now" / "5m ago" / "3h ago", falling back to an absolute Dubai date
 * once the gap passes a day.
 *
 * `now` is injectable so tests do not have to fake the clock.
 */
export function bookingRelativeTime(value: DateInput, now: DateInput = new Date()): string {
  const date = toDate(value)
  const reference = toDate(now)
  if (!date || !reference) return ''

  const diffMinutes = Math.round((reference.getTime() - date.getTime()) / 60_000)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)}h ago`

  return formatBookingDate(date, 'd MMM, HH:mm')
}

// --- Window boundaries -----------------------------------------------------
//
// Every one of these answers "when did this Dubai day/month begin, as a UTC
// instant". Compare against them with a half-open range (`>= start, < next`);
// an inclusive upper bound built from setHours(23, 59, 59, 999) drops whatever
// lands in the final second.

/**
 * Day arithmetic on a `yyyy-MM-dd` string, via UTC so it cannot pick up the
 * running process's offset or a DST jump.
 *
 * Deliberately a local copy of `addDays` from `lib/dashboard/revenue-range.ts`
 * rather than an import: this module sits below that one, and inverting the
 * dependency to save three lines is not worth it.
 */
function addDaysToDay(day: string, amount: number): string {
  const shifted = new Date(`${day}T00:00:00.000Z`).getTime() + amount * 86_400_000
  return new Date(shifted).toISOString().slice(0, 10)
}

/**
 * The UTC instant at which the Dubai day `days` ago began.
 *
 * `today` is injectable, and passing a value resolved on the server is what
 * keeps a client component from computing a different window than the one that
 * was server-rendered.
 */
export function bookingDaysAgoUtc(days: number, today: string = bookingToday()): Date {
  return bookingWallClockToUtc(addDaysToDay(today, -days), '00:00')
}

/** The UTC instant at which the current Dubai month began. */
export function startOfBookingMonthUtc(today: string = bookingToday()): Date {
  return bookingWallClockToUtc(`${today.slice(0, 7)}-01`, '00:00')
}
