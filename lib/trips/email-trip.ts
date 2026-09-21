import type { EmailTripDetails } from '@/lib/email/types'
import { hourlyEndTime, hourlyPackageLabel, isHourlyBooking, type TripColumns } from './display'

/**
 * Trip block for a single-booking email (hourly hire). Grouped trips build
 * theirs from every leg in the group finalizer. Returns undefined for one way,
 * so those emails are unchanged.
 */
export function hourlyEmailTrip(
  booking: TripColumns & { pickup_datetime: string; extra_hour_price?: number | null },
  convert: (aedAmount: number) => number = (amount) => amount
): EmailTripDetails | undefined {
  if (!isHourlyBooking(booking)) return undefined
  const summary = [
    hourlyPackageLabel(booking),
    booking.included_km ? `${booking.included_km} km included` : null,
  ].filter(Boolean).join(', ')

  return {
    tripType: 'hourly',
    label: 'Hourly hire',
    hourlySummary: summary,
    hourlyEndTime: hourlyEndTime(booking.pickup_datetime, booking) ?? undefined,
    extraHourPrice: booking.extra_hour_price ? convert(Number(booking.extra_hour_price)) : undefined,
  }
}
