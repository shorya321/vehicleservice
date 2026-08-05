import { isAgeInBand, childSeatFitHint, type SeatBand } from '@/lib/utils/child-seat-fit'
import {
  isAgeInBand as isAgeInBandBusiness,
  childSeatFitHint as childSeatFitHintBusiness,
} from '@/lib/business/child-seat-fit'

// Mirrors the live catalogue after 20260804_child_seat_age_bands.sql. Order matters: the hint
// names the FIRST matching alternative, and callers pass these in display_order.
const INFANT: SeatBand = { name: 'Infant Car Seat', child_age_min: 0, child_age_max: 1 }
const TODDLER: SeatBand = { name: 'Toddler Car Seat', child_age_min: 1, child_age_max: 4 }
const BOOSTER: SeatBand = { name: 'Booster Seat', child_age_min: 4, child_age_max: 11 }
const EXTRA_BOOSTER: SeatBand = { name: 'Extra Booster Seat', child_age_min: 4, child_age_max: 11 }
const UNCONFIGURED: SeatBand = { name: 'New Seat', child_age_min: null, child_age_max: null }

const ALL = [INFANT, TODDLER, BOOSTER, EXTRA_BOOSTER]

describe('isAgeInBand', () => {
  it('accepts ages inside the band, inclusive of both ends', () => {
    expect(isAgeInBand(0, INFANT)).toBe(true)
    expect(isAgeInBand(1, INFANT)).toBe(true)
    expect(isAgeInBand(4, BOOSTER)).toBe(true)
    expect(isAgeInBand(11, BOOSTER)).toBe(true)
  })

  it('rejects ages outside the band', () => {
    expect(isAgeInBand(2, INFANT)).toBe(false)
    expect(isAgeInBand(3, BOOSTER)).toBe(false)
    expect(isAgeInBand(12, BOOSTER)).toBe(false)
  })

  it('treats an unconfigured band as "no opinion"', () => {
    // This is what keeps a newly created add-on inert until an admin fills the range in.
    expect(isAgeInBand(0, UNCONFIGURED)).toBe(true)
    expect(isAgeInBand(12, UNCONFIGURED)).toBe(true)
  })

  it('treats a half-configured band as unconfigured rather than guessing', () => {
    // The DB CHECK makes this unreachable, but the helper must not crash on it either.
    expect(isAgeInBand(9, { name: 'X', child_age_min: 4, child_age_max: null })).toBe(true)
    expect(isAgeInBand(9, { name: 'X', child_age_min: null, child_age_max: 11 })).toBe(true)
  })
})

describe('childSeatFitHint', () => {
  it('says nothing when the age suits the seat', () => {
    expect(childSeatFitHint(0, INFANT, ALL)).toBeNull()
    expect(childSeatFitHint(6, BOOSTER, ALL)).toBeNull()
  })

  it('says nothing when no age has been chosen yet', () => {
    // The blank state is the job of the separate "Required" error, not this hint.
    expect(childSeatFitHint(null, INFANT, ALL)).toBeNull()
  })

  it('says nothing for an overlapping boundary age', () => {
    // 4 is legitimately in both Toddler (1-4) and Booster (4-11) — weight decides, not age.
    expect(childSeatFitHint(4, TODDLER, ALL)).toBeNull()
    expect(childSeatFitHint(4, BOOSTER, ALL)).toBeNull()
  })

  it('names the seat that fits when the age is too high', () => {
    expect(childSeatFitHint(7, INFANT, ALL)).toBe(
      '7-year-olds usually need a Booster Seat. Is that right?'
    )
  })

  it('names the seat that fits when the age is too low', () => {
    expect(childSeatFitHint(0, BOOSTER, ALL)).toBe(
      'Children under 1 usually need an Infant Car Seat. Is that right?'
    )
  })

  it('picks the correct article for a vowel-initial seat name', () => {
    // Seat names are admin-editable, so "a"/"an" has to be derived rather than assumed.
    expect(childSeatFitHint(0, BOOSTER, ALL)).toContain('an Infant Car Seat')
    expect(childSeatFitHint(7, INFANT, ALL)).toContain('a Booster Seat')
  })

  it('falls back to a generic nudge when nothing in the catalogue fits', () => {
    expect(childSeatFitHint(12, INFANT, ALL)).toBe('Check this seat suits a 12-year-old.')
  })

  it('phrases the generic fallback correctly for under-1', () => {
    expect(childSeatFitHint(0, { name: 'Odd Seat', child_age_min: 5, child_age_max: 9 }, [])).toBe(
      'Check this seat suits a child under 1.'
    )
  })

  it('never suggests the seat the customer already picked', () => {
    const hint = childSeatFitHint(12, BOOSTER, ALL)
    expect(hint).not.toContain('usually need a Booster Seat')
  })

  it('says nothing when the seat has no configured band', () => {
    expect(childSeatFitHint(12, UNCONFIGURED, ALL)).toBeNull()
  })

  it('ignores unconfigured addons when choosing an alternative', () => {
    // An add-on with no band is not evidence that it fits — it just has no opinion.
    expect(childSeatFitHint(7, INFANT, [UNCONFIGURED, BOOSTER])).toBe(
      '7-year-olds usually need a Booster Seat. Is that right?'
    )
  })

  it('tolerates an empty alternatives list', () => {
    expect(childSeatFitHint(7, INFANT)).toBe('Check this seat suits a 7-year-old.')
  })
})

describe('business copy stays in step with the customer copy', () => {
  // The duplication is deliberate (the business module is independent), but the two must not drift
  // silently — a customer and an operator should read the same wording for the same mismatch.
  const cases: Array<[number | null, SeatBand]> = [
    [null, INFANT],
    [0, INFANT],
    [7, INFANT],
    [0, BOOSTER],
    [4, TODDLER],
    [12, INFANT],
    [12, UNCONFIGURED],
  ]

  it.each(cases)('childSeatFitHint(%p, %p) matches', (age, seat) => {
    expect(childSeatFitHintBusiness(age, seat, ALL)).toBe(childSeatFitHint(age, seat, ALL))
  })

  it.each([0, 4, 7, 12])('isAgeInBand(%p) matches across both copies', (age) => {
    expect(isAgeInBandBusiness(age, BOOSTER)).toBe(isAgeInBand(age, BOOSTER))
  })
})
