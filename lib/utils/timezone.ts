import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

/**
 * The operating timezone: the wall-clock every booking, report and day boundary
 * is expressed in, independent of where the server runs or where the customer
 * browses from.
 *
 * Admin-configurable (Settings -> General), so it is read through
 * `getBookingTimezone()` rather than being a constant. The default stands until
 * the stored setting is loaded, and is what every fallback path uses.
 */
export const DEFAULT_BOOKING_TIMEZONE = 'Asia/Dubai'

/**
 * Process-wide, deliberately.
 *
 * This is one platform-level setting rather than a per-tenant one, so every
 * concurrent request wants the same answer and a module-level holder is the
 * right shape. It is set from the stored setting on the server and pushed to
 * the browser at hydration; see `lib/site-settings/timezone.ts`.
 */
let currentTimezone = DEFAULT_BOOKING_TIMEZONE

/** The operating timezone in effect right now. */
export function getBookingTimezone(): string {
  return currentTimezone
}

/**
 * Applies the stored setting. Ignores anything the runtime cannot resolve, so a
 * bad value in the database degrades to the default rather than throwing inside
 * every date on the site.
 */
export function setBookingTimezone(timeZone: string | null | undefined): void {
  if (!timeZone || !isValidTimezone(timeZone)) return
  currentTimezone = timeZone
}

export function isValidTimezone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

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
 * The zone's UTC offset, in minutes, at a given instant.
 *
 * Measured rather than assumed. The previous implementation hardcoded "+04:00",
 * which is exact for Asia/Dubai because it has no DST, but silently wrong for
 * any zone that does - an hour out for half the year, twice a year. Now that
 * the zone is admin-configurable, the offset has to be read per instant.
 */
function offsetMinutesAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  // `hour` comes back as 24 at midnight under hour12: false in some runtimes.
  const asIfUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour') % 24,
    read('minute'),
    read('second')
  )

  // Drop sub-second precision on both sides so the difference is a clean offset.
  return (asIfUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000
}

/**
 * The operating timezone's UTC offset in minutes at a given instant, positive
 * east of Greenwich.
 *
 * Exported for the two places that must do their own offset arithmetic: the
 * react-big-calendar display shim and the dashboard bucketing module.
 */
export function bookingOffsetMinutesAt(instant: Date = new Date()): number {
  return offsetMinutesAt(instant, getBookingTimezone())
}

/**
 * Builds the UTC instant for a `yyyy-MM-dd` date and `HH:mm` time read as
 * operating-timezone wall-clock.
 *
 * Two passes. The first guesses the offset by measuring it at the naive
 * instant; the second re-measures at the candidate, which is what keeps the
 * result exact when the wall-clock time sits on the far side of a DST
 * transition from the guess. For a zone without DST both passes agree and this
 * is equivalent to the old fixed-offset string.
 */
export function bookingWallClockToUtc(
  date: string,
  time: string,
  timeZone: string = getBookingTimezone()
): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  const naive = Date.UTC(year, (month ?? 0) - 1, day, hour, minute)

  if (Number.isNaN(naive)) {
    throw new Error(`Invalid pickup date/time: ${date} ${time}`)
  }

  const firstGuess = new Date(naive - offsetMinutesAt(new Date(naive), timeZone) * 60_000)
  const settled = new Date(naive - offsetMinutesAt(firstGuess, timeZone) * 60_000)

  if (Number.isNaN(settled.getTime())) {
    throw new Error(`Invalid pickup date/time: ${date} ${time}`)
  }

  return settled
}

/** Wraps a stored ISO timestamp so date-fns `format` renders it as operating wall-clock. */
export function toBookingTz(iso: string): TZDate {
  return new TZDate(iso, getBookingTimezone())
}

/**
 * Intl formatters are expensive to build and the zone rarely changes, so they
 * are cached per zone rather than per call.
 */
const dayFormatters = new Map<string, Intl.DateTimeFormat>()

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dayFormatters.get(timeZone)

  if (!formatter) {
    // en-CA yields ISO order, which is what makes the result sortable.
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    dayFormatters.set(timeZone, formatter)
  }

  return formatter
}

/**
 * The operating-timezone calendar day (`yyyy-MM-dd`) a given instant falls on.
 *
 * Use this for grouping and for "same day?" comparisons. Reading `getDate()`
 * off a Date instead answers the question in the viewer's timezone, so a feed
 * grouped that way shows different day headings to a customer abroad.
 */
export function bookingDayKey(value: DateInput): string {
  const date = toDate(value)
  return date ? dayFormatter(getBookingTimezone()).format(date) : ''
}

/** Today's date as `yyyy-MM-dd` in the operating timezone. */
export function bookingToday(): string {
  return dayFormatter(getBookingTimezone()).format(new Date())
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

/** A stored instant as an operating-timezone date, e.g. `11 Aug 2026`. */
export function formatBookingDate(value: DateInput, pattern = 'dd MMM yyyy'): string {
  const date = toDate(value)
  return date ? format(new TZDate(date, getBookingTimezone()), pattern) : ''
}

/** A stored instant as an operating-timezone date and time, e.g. `11 Aug 2026 at 14:32`. */
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
