/**
 * Guest breakdown helpers for business bookings.
 *
 * Pure logic, no React — shared by the booking wizard UI and the email templates, so the two
 * cannot drift apart.
 *
 * Seat semantics: adults + children consume seats; infants ride on a lap and do not.
 * `business_bookings.passenger_count` holds the seated total.
 */

export interface GuestBreakdown {
  adults: number;
  children: number;
  infants: number;
}

/** Seats consumed. Infants ride on a lap and are excluded by design. */
export function getSeatedCount(value: GuestBreakdown): number {
  return value.adults + value.children;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** e.g. "2 adults, 1 child · 1 infant" */
export function formatGuestSummary(value: GuestBreakdown): string {
  const parts = [pluralize(value.adults, 'adult', 'adults')];

  if (value.children > 0) {
    parts.push(pluralize(value.children, 'child', 'children'));
  }

  const summary = parts.join(', ');

  return value.infants > 0
    ? `${summary} · ${pluralize(value.infants, 'infant', 'infants')}`
    : summary;
}
