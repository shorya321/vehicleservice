import type { EmailTripDetails } from '@/lib/email/types'
import { formatBookingDate, formatBookingTime } from '@/lib/utils/timezone'
import { hourlyEndTime, hourlyPackageLabel, isHourlyBooking, legLabel, type TripColumns } from './display'

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

interface GroupLegRow {
  trip_number: string | null
  booking_number: string
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  leg_index: number | null
  trip_type: string | null
}

/** Trip block for a paid round trip or multi-city trip: every journey, in order. */
export function groupEmailTrip(
  group: { groupNumber: string; tripType: 'round_trip' | 'multi_city'; legs: GroupLegRow[]; discount: number },
  convert: (aedAmount: number) => number = (amount) => amount
): EmailTripDetails {
  const legs = [...group.legs].sort((a, b) => (a.leg_index ?? 0) - (b.leg_index ?? 0))
  return {
    tripType: group.tripType,
    label: group.tripType === 'round_trip' ? 'Round trip' : 'Multi-city trip',
    groupNumber: group.groupNumber,
    discountAmount: group.discount > 0 ? convert(group.discount) : undefined,
    legs: legs.map((leg) => ({
      label: legLabel(leg, legs.length) ?? 'Journey',
      tripNumber: leg.trip_number || leg.booking_number,
      pickupLocation: leg.pickup_address,
      dropoffLocation: leg.dropoff_address,
      pickupDate: formatBookingDate(leg.pickup_datetime, 'EEEE, MMMM d, yyyy'),
      pickupTime: formatBookingTime(leg.pickup_datetime, 'hh:mm a'),
    })),
  }
}
