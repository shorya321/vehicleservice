/**
 * How an unavailability period is described to the vendor.
 *
 * The stored range is half-open: the start is included, the end is not. That
 * matches the database exclusion constraints (`tstzrange(..., '[)')`) and the
 * overlap test in `lib/vendor/direct-bookings/availability.ts`, so a block
 * ending at Sep 6 00:00 leaves Sep 6 completely free.
 *
 * Printing those two instants literally is accurate and useless: a vendor who
 * blocks one day reads "Sep 05, 2026 00:00 - Sep 06, 2026 00:00", sees the 6th
 * named, and concludes the 6th is blocked too. The range is right; the sentence
 * is what needs to change.
 */

import { format } from 'date-fns'

import { toBookingTz } from '@/lib/utils/timezone'

/** True when the instant lands exactly on midnight in Dubai. */
function isDubaiMidnight(instant: Date): boolean {
  return format(toBookingTz(instant.toISOString()), 'HH:mm') === '00:00'
}

/**
 * True when the range covers whole Dubai days end to end.
 *
 * Month-view drags always produce these, because a month cell has no finer
 * granularity to offer. Week and Day drags produce times.
 */
export function isWholeDayPeriod(start: Date, end: Date): boolean {
  return end > start && isDubaiMidnight(start) && isDubaiMidnight(end)
}

/**
 * A sentence naming the period, in Dubai time.
 *
 * Whole-day ranges name the days they actually block, so the exclusive end
 * never appears. Part-day ranges keep their times.
 */
export function unavailabilityPeriodLabel(start: Date, end: Date): string {
  const startDubai = toBookingTz(start.toISOString())

  if (isWholeDayPeriod(start, end)) {
    // The last day the block actually covers, rather than the exclusive end.
    const lastCovered = toBookingTz(new Date(end.getTime() - 1).toISOString())

    return format(startDubai, 'yyyy-MM-dd') === format(lastCovered, 'yyyy-MM-dd')
      ? `All day on ${format(startDubai, 'MMM dd, yyyy')}`
      : `${format(startDubai, 'MMM dd')} to ${format(lastCovered, 'MMM dd, yyyy')}, all day`
  }

  const endDubai = toBookingTz(end.toISOString())
  const sameDay = format(startDubai, 'yyyy-MM-dd') === format(endDubai, 'yyyy-MM-dd')

  return sameDay
    ? `${format(startDubai, 'MMM dd, yyyy HH:mm')} to ${format(endDubai, 'HH:mm')}`
    : `${format(startDubai, 'MMM dd, yyyy HH:mm')} to ${format(endDubai, 'MMM dd, yyyy HH:mm')}`
}
