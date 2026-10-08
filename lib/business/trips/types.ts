/**
 * Trip types a business can book.
 * SCOPE: Business module ONLY. Business twin of lib/trips/types.ts. Do not de-duplicate:
 * the two flows are free to diverge (wallet vs card, price visibility, wording).
 *
 * - `one_way`: a single A to B transfer (the original shape, untouched by this module).
 * - `round_trip`: outbound plus the reverse route, two `business_bookings` rows in one group.
 * - `multi_city`: independent journeys, one row each, in one group.
 * - `hourly`: a chauffeur for a fixed package of hours, "as directed". One row, no destination.
 *
 * Round trip and multi-city share a `business_booking_groups` row, which is the unit the
 * wallet is charged for once.
 */
export const BUSINESS_TRIP_TYPES = ['one_way', 'round_trip', 'multi_city', 'hourly'] as const;
export type BusinessTripType = (typeof BUSINESS_TRIP_TYPES)[number];

export const BUSINESS_GROUPED_TRIP_TYPES = ['round_trip', 'multi_city'] as const;
export type BusinessGroupedTripType = (typeof BUSINESS_GROUPED_TRIP_TYPES)[number];

export const BUSINESS_HOURLY_PACKAGES = ['half_day', 'full_day'] as const;
export type BusinessHourlyPackage = (typeof BUSINESS_HOURLY_PACKAGES)[number];

/** One priced journey. All money in AED. */
export interface BusinessLegQuote {
  base: number;
  discount: number;
  total: number;
}

export interface BusinessTripQuote {
  legs: BusinessLegQuote[];
  subtotal: number;
  discountPercent: number;
  discount: number;
  total: number;
}

export interface BusinessHourlyPackageRow {
  package: BusinessHourlyPackage;
  hours: number;
  includedKm: number;
  price: number;
  extraHourPrice: number;
}

/** A journey as the wizard collects it. Date is `yyyy-MM-dd`, time `HH:mm`, both operating-timezone. */
export interface BusinessTripLegInput {
  from_location_id: string;
  to_location_id: string;
  from_location_name?: string;
  to_location_name?: string;
  pickup_address: string;
  dropoff_address: string;
  date: string;
  time: string;
}

export function isBusinessTripType(value: unknown): value is BusinessTripType {
  return typeof value === 'string' && (BUSINESS_TRIP_TYPES as readonly string[]).includes(value);
}

export function isBusinessGroupedTripType(value: unknown): value is BusinessGroupedTripType {
  return typeof value === 'string' && (BUSINESS_GROUPED_TRIP_TYPES as readonly string[]).includes(value);
}

export function isBusinessHourlyPackage(value: unknown): value is BusinessHourlyPackage {
  return typeof value === 'string' && (BUSINESS_HOURLY_PACKAGES as readonly string[]).includes(value);
}

/** The price breakdown behind one vehicle card of a trip quote. */
export interface BusinessTripVehicleQuote {
  /** Each journey's fare before discount, in travel order. Hourly: the package price. */
  legFares: number[];
  subtotal: number;
  discountPercent: number;
  discount: number;
  /** Trip fares after discount, before add-ons. Equals the signed base price. */
  total: number;
  hourly?: {
    package: BusinessHourlyPackage;
    hours: number;
    includedKm: number;
    extraHourPrice: number;
  };
}
