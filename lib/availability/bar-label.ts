/**
 * The short label a Fleet timeline bar carries.
 *
 * Fleet bars are sized by duration, so their width has nothing to do with how
 * long their text is. The full event titles are built for the calendar views,
 * where there is no resource lane to give them context, and they are long:
 * `Chevrolet Tahoe - maintenance` needs ~182px, `ZZ-OVERLAP-A · Overlap A`
 * ~159px. A four-hour trip on the week board is ~80px. Something had to give.
 *
 * On the Fleet board the lane already names the vehicle or the driver, so the
 * resource half of the title is repeated and the reference is noise at a
 * glance. Dropping both takes a typical label to ~70px, which most bars can
 * hold at their natural width. The full title stays in the bar's tooltip and in
 * the details dialog, so nothing is lost - it just is not shouted.
 *
 * Calendar month and week views keep the full titles. There is no lane there,
 * and "Maintenance" alone would not say which vehicle.
 */

import {
  bookingDetailsOf,
  unavailabilityDetailsOf,
  type CalendarEvent,
} from '@/app/vendor/availability/types'

/** `maintenance` -> `Maintenance`, `sick` -> `Sick`. Reasons are stored lower-case free text. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function fleetBarLabel(event: Pick<CalendarEvent, 'title' | 'type' | 'source' | 'details'>): string {
  if (event.type === 'unavailable') {
    const reason = unavailabilityDetailsOf(event)?.reason?.trim()
    return reason ? titleCase(reason) : event.title
  }

  // Offline bookings are titled `<reference> · <customer>`. The customer is the
  // half a dispatcher actually scans for; the reference is one hover away.
  if (event.source === 'offline') {
    const customer = bookingDetailsOf(event)?.customer?.trim()
    if (customer) return customer
  }

  // Online bookings are already `Trip #1234`, and pending offers share that
  // shape. Anything missing its details falls back here too, so a malformed row
  // degrades to the old behaviour rather than to an empty bar.
  return event.title
}
