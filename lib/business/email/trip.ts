/**
 * Round trip, multi-city or hourly detail for business booking emails.
 * SCOPE: Business module ONLY. Business twin of EmailTripDetails in lib/email/types.ts.
 *
 * Absent for a one-way booking, whose emails render exactly as before.
 */
export interface BusinessEmailTripJourney {
  /** "Outbound", "Return", "Journey 2 of 3". */
  label: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
}

export interface BusinessEmailTrip {
  /** "Round trip", "Multi-city", "Hourly". */
  label: string;
  /** Grouped trips: the reference the whole trip is filed under. */
  groupNumber?: string;
  /** Hourly: "Half day · 5 h · 100 km included". */
  hourlySummary?: string;
  /** Grouped trips: every journey, in travel order. */
  journeys?: BusinessEmailTripJourney[];
  /** Grouped trips: round-trip saving, in the email's currency. Owner-facing emails only. */
  discountAmount?: number;
}

/** The reference a trip email leads with: the trip's group number, else the booking's own. */
export function businessTripEmailReference(
  trip: BusinessEmailTrip | undefined,
  fallback: string
): string {
  return trip?.groupNumber || fallback;
}
