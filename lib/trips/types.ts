/**
 * Trip types a customer can book.
 *
 * - `one_way`: a single A to B transfer (the original and default shape).
 * - `round_trip`: outbound plus the reverse route, two `bookings` rows in one group.
 * - `multi_city`: independent legs, one `bookings` row each, in one group.
 * - `hourly`: a chauffeur for a fixed package of hours, "as directed". One row, no destination.
 *
 * Round trip and multi-city share a `booking_groups` row, which is the payable
 * unit: one Stripe PaymentIntent, one invoice, one confirmation.
 */
export const TRIP_TYPES = ['one_way', 'round_trip', 'multi_city', 'hourly'] as const
export type TripType = (typeof TRIP_TYPES)[number]

export const GROUPED_TRIP_TYPES = ['round_trip', 'multi_city'] as const
export type GroupedTripType = (typeof GROUPED_TRIP_TYPES)[number]

export const HOURLY_PACKAGES = ['half_day', 'full_day'] as const
export type HourlyPackage = (typeof HOURLY_PACKAGES)[number]

/** A leg as it travels through search and checkout URLs. */
export interface TripLegParam {
  /** Location slug of the pickup. */
  from: string
  /** Location slug of the dropoff. */
  to: string
  /** `yyyy-MM-dd`, operating-timezone calendar date. */
  date: string
  /** `HH:mm`, operating-timezone wall-clock. Only known once checkout collects it. */
  time?: string
}

/** Trip-specific search parameters layered on top of the one-way ones. */
export interface TripSearchParams {
  trip: TripType
  /** Round trip: return date, `yyyy-MM-dd`. */
  returnDate?: string
  /** Round trip: return time, `HH:mm`. */
  returnTime?: string
  /** Hourly: which package. */
  hourlyPackage?: HourlyPackage
  /** Multi-city: legs in travel order. */
  legs?: TripLegParam[]
}

/** One priced leg of a quote. All money in the base currency (AED). */
export interface LegQuote {
  base: number
  discount: number
  total: number
}

export interface TripQuote {
  legs: LegQuote[]
  subtotal: number
  discountPercent: number
  discount: number
  total: number
}

export interface HourlyPackageRow {
  package: HourlyPackage
  hours: number
  includedKm: number
  price: number
  extraHourPrice: number
  currency: string
}

export function isTripType(value: unknown): value is TripType {
  return typeof value === 'string' && (TRIP_TYPES as readonly string[]).includes(value)
}

export function isGroupedTripType(value: unknown): value is GroupedTripType {
  return typeof value === 'string' && (GROUPED_TRIP_TYPES as readonly string[]).includes(value)
}

export function isHourlyPackage(value: unknown): value is HourlyPackage {
  return typeof value === 'string' && (HOURLY_PACKAGES as readonly string[]).includes(value)
}
