/**
 * SCOPE: Business module ONLY. Business twin of lib/trips/constants.ts. Do not de-duplicate.
 */
import type { BusinessHourlyPackage, BusinessTripType } from './types';

/**
 * Written into `business_bookings.dropoff_address` for hourly hire. The column is NOT NULL and
 * read by every email, list and detail screen, so a readable constant keeps them all sensible.
 */
export const BUSINESS_AS_DIRECTED = 'As directed';

export const BUSINESS_TRIP_TYPE_LABELS: Record<BusinessTripType, string> = {
  one_way: 'One way',
  round_trip: 'Round trip',
  multi_city: 'Multi-city',
  hourly: 'Hourly',
};

export const BUSINESS_HOURLY_PACKAGE_LABELS: Record<BusinessHourlyPackage, string> = {
  half_day: 'Half day',
  full_day: 'Full day',
};

/** Upper bound on multi-city journeys regardless of the admin setting (matches the DB check). */
export const BUSINESS_MAX_LEGS_HARD_LIMIT = 6;

/** Used when a route has no recorded duration. */
export const BUSINESS_DEFAULT_LEG_DURATION_MINUTES = 60;
