import type { HourlyPackage, TripType } from './types'

/**
 * Written into `bookings.dropoff_address` for hourly hire. The column is NOT
 * NULL and read in about twenty places, so a readable constant keeps every one
 * of them rendering sensibly without a nullable migration.
 */
export const AS_DIRECTED = 'As directed'

/** Prefix of `booking_groups.group_number`, so payment and invoice routes can tell a group from a booking. */
export const GROUP_NUMBER_PREFIX = 'GR'

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  one_way: 'One way',
  round_trip: 'Round trip',
  multi_city: 'Multi-city',
  hourly: 'Hourly',
}

export const HOURLY_PACKAGE_LABELS: Record<HourlyPackage, string> = {
  half_day: 'Half day',
  full_day: 'Full day',
}

/** Suggested defaults when an admin first sets a package up. */
export const HOURLY_PACKAGE_DEFAULTS: Record<HourlyPackage, { hours: number; includedKm: number }> = {
  half_day: { hours: 5, includedKm: 100 },
  full_day: { hours: 10, includedKm: 200 },
}

/** Upper bound on multi-city legs regardless of the admin setting (matches the DB check). */
export const MAX_LEGS_HARD_LIMIT = 6
