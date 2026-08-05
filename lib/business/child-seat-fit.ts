/**
 * Does the age entered for a child seat actually suit that seat?
 *
 * Each Child Safety add-on carries an admin-configured `child_age_min` / `child_age_max`. The age
 * dropdown deliberately offers the FULL 0-12 range for every seat rather than narrowing to the
 * band: if the options were constrained to the seat, the age could never contradict the seat, and
 * that contradiction is the entire reason the age is collected. A parent offered only "Under 1" on
 * an Infant Car Seat for their 7-year-old would most likely pick the closest allowed value and move
 * on, storing a false age as fact. So the mismatch is surfaced as an advisory hint instead.
 *
 * The hint NEVER blocks. Real children fall outside typical bands (small or large for their age,
 * medical needs) and the parent is the authority on their own child.
 *
 * NOTE: lib/utils/child-seat-fit.ts holds an equivalent copy for the customer flow. The
 * duplication is DELIBERATE — the business module is kept independent of the customer flow, so the
 * two are free to diverge without one breaking the other. This mirrors the same rule already
 * applied to lib/business/guest-breakdown.ts and lib/business/format-child-ages.ts. Do not
 * "de-duplicate" these into a shared module.
 *
 * tests/validation/child-seat-fit.test.ts asserts the two produce identical output today, so a
 * deliberate divergence is a conscious edit rather than a silent drift.
 */

export interface SeatBand {
  name: string
  child_age_min: number | null
  child_age_max: number | null
  requires_child_age?: boolean
}

/**
 * Plural subject, e.g. "7-year-olds" / "Children under 1".
 * Plural on purpose: it sidesteps the "a/an" problem in front of the age.
 */
function ageSubject(age: number): string {
  return age === 0 ? 'Children under 1' : `${age}-year-olds`
}

/** Singular object, e.g. "a 7-year-old" / "a child under 1". */
function ageObject(age: number): string {
  return age === 0 ? 'a child under 1' : `a ${age}-year-old`
}

/** Seat names are admin-editable, so the article has to be derived, not assumed. */
function article(name: string): string {
  return /^[aeiou]/i.test(name.trim()) ? 'an' : 'a'
}

/**
 * True when the age suits the seat, or when the seat has no configured band.
 *
 * An unconfigured band (both null) means "no opinion" and must never warn — that is what keeps a
 * newly created add-on inert until an admin fills the range in.
 */
export function isAgeInBand(age: number, seat: SeatBand): boolean {
  if (seat.child_age_min === null || seat.child_age_max === null) return true
  return age >= seat.child_age_min && age <= seat.child_age_max
}

/**
 * Advisory text when `age` does not suit `seat`, otherwise null.
 *
 * Names a better-fitting seat from `alternatives` when one exists, since "which seat should I have
 * picked" is the question the customer actually needs answered. Bands may overlap (a 4-year-old
 * suits both Toddler and Booster), so the first match in the caller's order — display_order —
 * wins, matching what the customer sees on screen.
 */
export function childSeatFitHint(
  age: number | null,
  seat: SeatBand,
  alternatives: SeatBand[] = []
): string | null {
  if (age === null) return null
  if (isAgeInBand(age, seat)) return null

  const better = alternatives.find(
    (a) =>
      a.name !== seat.name &&
      a.child_age_min !== null &&
      a.child_age_max !== null &&
      isAgeInBand(age, a)
  )

  return better
    ? `${ageSubject(age)} usually need ${article(better.name)} ${better.name}. Is that right?`
    : `Check this seat suits ${ageObject(age)}.`
}
