/**
 * Display-time shim for react-big-calendar.
 *
 * Every stored timestamp in this product is a UTC instant that means a
 * Asia/Dubai wall-clock time (`lib/utils/timezone.ts`). The Fleet timeline and
 * the details dialog render it that way, because they format through
 * `toBookingTz`. React-big-calendar cannot: it reads `Date.getHours()` to place
 * an event on the grid, which yields the *browser's* hours. A vendor browsing
 * from India therefore saw one booking as 10:30 in the week grid and 09:00
 * everywhere else.
 *
 * Rather than swap the localizer (which would change RBC's internal date
 * arithmetic, its drag-selection maths and every format string in one go), the
 * dates handed to RBC are shifted so that reading them in the browser's
 * timezone produces Dubai wall-clock. Everything RBC hands back is shifted
 * again by the inverse, so slot selection still writes a true instant.
 *
 * Only react-big-calendar sees shifted dates. Never pass one to a server
 * action, to `toBookingTz`, or into a comparison against `new Date()`.
 */

import { BOOKING_UTC_OFFSET_MINUTES } from '@/lib/utils/timezone'

/**
 * Milliseconds to add to a real instant so the browser renders it as Dubai
 * wall-clock. Dubai's side is constant (no DST); the browser's is read per
 * date, so a browser that does observe DST stays correct either side of a
 * transition.
 */
function shiftMs(reference: Date): number {
  // getTimezoneOffset() is minutes to add to local time to reach UTC, so it is
  // negative east of Greenwich. Negate it to get the conventional UTC offset.
  const browserOffsetMinutes = -reference.getTimezoneOffset()
  return (BOOKING_UTC_OFFSET_MINUTES - browserOffsetMinutes) * 60_000
}

/** Real instant -> the date to hand react-big-calendar. */
export function toDisplayDate(instant: Date): Date {
  return new Date(instant.getTime() + shiftMs(instant))
}

/**
 * A date react-big-calendar produced -> the real instant.
 *
 * Two passes: the first recovers an approximate instant, the second recomputes
 * the browser offset at *that* instant. On a DST-observing browser the shifted
 * and unshifted dates can straddle a transition, and the second pass is what
 * keeps `fromDisplayDate(toDisplayDate(t))` exactly `t`.
 */
export function fromDisplayDate(displayed: Date): Date {
  const approximate = new Date(displayed.getTime() - shiftMs(displayed))
  return new Date(displayed.getTime() - shiftMs(approximate))
}

/**
 * "Now", expressed as a display date, for anything RBC positions against the
 * current time.
 */
export function displayNow(): Date {
  return toDisplayDate(new Date())
}
