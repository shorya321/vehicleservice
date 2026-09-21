import { formatBookingTime } from '@/lib/utils/timezone'
import { HOURLY_PACKAGE_LABELS, TRIP_TYPE_LABELS } from './constants'
import { isHourlyPackage, isTripType, type TripType } from './types'

/**
 * How a stored booking describes its trip, in one place, for every surface
 * that shows one: payment, confirmation, account, admin, vendor, emails, PDF.
 * All inputs are the raw `bookings` columns, so any row can be passed as is.
 */
export interface TripColumns {
  trip_type?: string | null
  hourly_package?: string | null
  duration_hours?: number | null
  included_km?: number | null
  leg_index?: number | null
}

export function tripTypeOf(row: TripColumns): TripType {
  return isTripType(row.trip_type) ? row.trip_type : 'one_way'
}

export function tripTypeLabel(row: TripColumns): string {
  return TRIP_TYPE_LABELS[tripTypeOf(row)]
}

export function isHourlyBooking(row: TripColumns): boolean {
  return tripTypeOf(row) === 'hourly'
}

/** "Half day, 5 hours". Null for anything that is not hourly. */
export function hourlyPackageLabel(row: TripColumns): string | null {
  if (!isHourlyBooking(row)) return null
  const pkg = isHourlyPackage(row.hourly_package) ? HOURLY_PACKAGE_LABELS[row.hourly_package] : 'Hourly'
  const hours = row.duration_hours ? Number(row.duration_hours) : null
  return hours ? `${pkg}, ${hours} hours` : pkg
}

/** "Half day · 5 h · 100 km included", for compact rows. */
export function hourlySummary(row: TripColumns): string | null {
  if (!isHourlyBooking(row)) return null
  const parts = [
    isHourlyPackage(row.hourly_package) ? HOURLY_PACKAGE_LABELS[row.hourly_package] : 'Hourly',
    row.duration_hours ? `${Number(row.duration_hours)} h` : null,
    row.included_km ? `${row.included_km} km included` : null,
  ]
  return parts.filter(Boolean).join(' · ')
}

/** "Outbound" / "Return" for a round trip, "Journey 2 of 3" for multi-city, null otherwise. */
export function legLabel(row: TripColumns, legCount?: number | null): string | null {
  const type = tripTypeOf(row)
  if (row.leg_index === null || row.leg_index === undefined) return null
  if (type === 'round_trip') return row.leg_index === 0 ? 'Outbound' : 'Return'
  if (type === 'multi_city') {
    return legCount ? `Journey ${row.leg_index + 1} of ${legCount}` : `Journey ${row.leg_index + 1}`
  }
  return null
}

/** End of an hourly hire in the operating timezone, e.g. "15:00". */
export function hourlyEndTime(pickupIso: string, row: TripColumns): string | null {
  if (!isHourlyBooking(row) || !row.duration_hours) return null
  const end = new Date(new Date(pickupIso).getTime() + Number(row.duration_hours) * 3_600_000)
  return Number.isNaN(end.getTime()) ? null : formatBookingTime(end)
}

/** The "to" side of a route line: the destination, or "Hourly · 5 h" for an hourly hire. */
export function destinationLabel(row: TripColumns & { dropoff_address?: string | null }, destinationName?: string | null): string {
  if (isHourlyBooking(row)) {
    return row.duration_hours ? `Hourly · ${Number(row.duration_hours)} h` : 'Hourly'
  }
  return destinationName || row.dropoff_address || ''
}

/**
 * One line for vendor and driver emails and screens, so the person doing the
 * job knows it is not a plain transfer: the hours to hold for an hourly hire,
 * or which journey of a trip this is. Null for one way.
 */
export function tripAssignmentLabel(row: TripColumns, legCount?: number | null): string | null {
  const type = tripTypeOf(row)
  if (type === 'hourly') {
    const parts = [hourlyPackageLabel(row), row.included_km ? `${row.included_km} km included` : null]
    return `Hourly hire: ${parts.filter(Boolean).join(', ')}, as directed`
  }
  if (type === 'round_trip') return `Round trip, ${legLabel(row, legCount)?.toLowerCase() ?? 'leg'} journey`
  if (type === 'multi_city') return `Multi-city trip, ${legLabel(row, legCount)?.toLowerCase() ?? 'journey'}`
  return null
}
