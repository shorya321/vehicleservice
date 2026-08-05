/**
 * Formatting for the per-seat child ages stored on `booking_amenities.child_ages`.
 *
 * NOTE: lib/business/format-child-ages.ts holds an equivalent copy for the business portal. The
 * duplication is DELIBERATE — the business module is kept independent of the customer flow, so the
 * two are free to diverge (different wording, different price visibility) without one breaking the
 * other. Do not "de-duplicate" these into a shared module.
 */

/**
 * Renders a seat's ages as a label suffix: `" (ages <1, 4)"`.
 *
 * Returns an empty string for null / undefined / empty input, which is what lets every add-on that
 * predates this feature — and every non-child add-on — render exactly as it always has.
 */
export function formatChildAges(ages?: number[] | null): string {
  if (!ages || ages.length === 0) return ''
  const parts = ages.map((age) => (age === 0 ? '<1' : String(age)))
  return ` (${parts.length === 1 ? 'age' : 'ages'} ${parts.join(', ')})`
}
