/**
 * Guest breakdown helpers for the customer-facing search.
 *
 * Pure logic, no React.
 *
 * NOTE: `lib/business/guest-breakdown.ts` holds an equivalent copy for the business portal. The
 * duplication is DELIBERATE — the business module is kept independent of the customer flow, so the
 * two are free to diverge (different caps, different seat rules) without one breaking the other.
 * Do not "de-duplicate" these into a shared module.
 *
 * Seat semantics: every guest occupies a seat, infants included. UAE law requires a child safety
 * seat for under-4s and a restraint to age 10, and a child seat takes up a seat position — so an
 * infant cannot be counted as a lap passenger the way airlines do.
 */

export interface GuestBreakdown {
  adults: number;
  children: number;
  infants: number;
}

/** Seats consumed. Infants included — a child seat occupies a seat position. */
export function getSeatedCount(value: GuestBreakdown): number {
  return value.adults + value.children + value.infants;
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
