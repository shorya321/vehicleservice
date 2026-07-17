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

/**
 * Resolve the guest breakdown for a checkout page from raw URL params, clamped to what the vehicle
 * can carry.
 *
 * Both checkout routes use this so the total and the parts are derived together and can never
 * contradict each other:
 * - No breakdown in the URL (route cards, zone pages, old links) -> all adults.
 * - Over capacity -> fall back to a clamped all-adults party rather than silently keeping a
 *   breakdown that sums to more than the total.
 * - NaN / junk (`?passengers=abc`) -> 1.
 */
export function resolveGuestsForVehicle(
  raw: {
    passengers?: string
    adults?: string
    children?: string
    infants?: string
  },
  passengerCapacity: number
): GuestBreakdown {
  const num = (v: string | undefined, fallback: number): number => {
    const n = parseInt(v ?? '')
    return Number.isNaN(n) ? fallback : n
  }

  const total = Math.max(1, num(raw.passengers, 1))

  const hasBreakdown = raw.adults !== undefined
  const candidate: GuestBreakdown = hasBreakdown
    ? {
        adults: Math.max(1, num(raw.adults, 1)),
        children: Math.max(0, num(raw.children, 0)),
        infants: Math.max(0, num(raw.infants, 0)),
      }
    : { adults: total, children: 0, infants: 0 }

  // A breakdown that disagrees with the stated total is untrustworthy — prefer the total.
  if (hasBreakdown && getSeatedCount(candidate) !== total) {
    return { adults: Math.min(total, passengerCapacity), children: 0, infants: 0 }
  }

  if (getSeatedCount(candidate) > passengerCapacity) {
    return { adults: Math.max(1, passengerCapacity), children: 0, infants: 0 }
  }

  return candidate
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
