/**
 * Formatting for the per-seat child ages stored on `business_booking_addons.child_ages` and
 * `business_quotation_item_addons.child_ages`.
 *
 * NOTE: lib/utils/child-ages.ts holds an equivalent copy for the customer flow. The duplication is
 * DELIBERATE — the business module is kept independent of the customer flow, so the two are free to
 * diverge (different wording, different price visibility) without one breaking the other. This
 * mirrors the same rule already applied to lib/business/guest-breakdown.ts. Do not "de-duplicate"
 * these into a shared module.
 *
 * tests/validation/child-ages.test.ts asserts the two produce identical output today, so a
 * deliberate divergence is a conscious edit rather than a silent drift.
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
