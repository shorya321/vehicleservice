/**
 * The floor on child seats, as a pure function.
 *
 * `childSeatShortfall` is what both business buttons gate on, and
 * `childSeatShortfallMessage` is the only copy either of them shows, so the wording is
 * pinned here rather than in two component tests that could drift apart.
 */

import {
  childSeatShortfall,
  childSeatShortfallMessage,
  draftSeatCount,
} from '@/lib/business/child-seat-requirement'

describe('childSeatShortfall', () => {
  it('is 0 when there are no children or infants', () => {
    // The common case. Nothing about a normal adult booking may change.
    expect(childSeatShortfall(0, 0)).toBe(0)
  })

  it('is the full capacity when nothing has been selected', () => {
    expect(childSeatShortfall(0, 2)).toBe(2)
  })

  it('counts down as seats are added', () => {
    expect(childSeatShortfall(1, 3)).toBe(2)
    expect(childSeatShortfall(2, 3)).toBe(1)
  })

  it('is 0 once the requirement is met', () => {
    expect(childSeatShortfall(3, 3)).toBe(0)
  })

  it('is 0 when over-selected, which the pickers and the server report themselves', () => {
    expect(childSeatShortfall(5, 2)).toBe(0)
  })

  it('never returns a negative from a nonsense seat count', () => {
    expect(childSeatShortfall(-1, 0)).toBe(0)
  })
})

describe('childSeatShortfallMessage', () => {
  it('is empty when nothing is owed, so a caller cannot render a blank alert', () => {
    expect(childSeatShortfallMessage(0, 0)).toBe('')
    expect(childSeatShortfallMessage(0, 2)).toBe('')
  })

  it('does not say "more" when none have been selected yet', () => {
    expect(childSeatShortfallMessage(2, 2)).toBe(
      'Select 2 child seats. This trip carries 2 children and infants, and each one needs their own seat.'
    )
  })

  it('says "more" once some are selected', () => {
    expect(childSeatShortfallMessage(1, 3)).toBe(
      'Select 1 more child seat. This trip carries 3 children and infants, and each one needs their own seat.'
    )
  })

  it('reads correctly for a single guest', () => {
    expect(childSeatShortfallMessage(1, 1)).toBe(
      'Select 1 child seat. This trip carries 1 child or infant, and each one needs their own seat.'
    )
  })

  it('carries none of the punctuation the repo bans', () => {
    const samples = [
      childSeatShortfallMessage(1, 1),
      childSeatShortfallMessage(2, 2),
      childSeatShortfallMessage(1, 3),
    ]
    for (const message of samples) {
      expect(message).not.toMatch(/[–—‘’“”…]/)
    }
  })
})

describe('draftSeatCount', () => {
  it('counts a freshly picked seat by its flag', () => {
    expect(draftSeatCount([{ quantity: 2, requires_child_age: true, child_ages: [0, null] }])).toBe(2)
  })

  it('counts a RELOADED seat, which has no flag, by its child_ages', () => {
    // The case that makes the two-part test necessary: requires_child_age is deliberately never
    // persisted, so a trip loaded for editing carries only child_ages. Counting the flag alone
    // would read 0 here and let the sheet save a trip whose children have no seats.
    expect(draftSeatCount([{ quantity: 2, child_ages: [1, 4] }])).toBe(2)
  })

  it('ignores non-seat addons, reloaded or not', () => {
    expect(
      draftSeatCount([
        { quantity: 1 },
        { quantity: 3, child_ages: null },
        { quantity: 1, requires_child_age: false },
      ])
    ).toBe(0)
  })

  it('sums across several seat addons', () => {
    expect(
      draftSeatCount([
        { quantity: 1, requires_child_age: true, child_ages: [0] },
        { quantity: 2, child_ages: [5, 7] },
        { quantity: 1 },
      ])
    ).toBe(3)
  })

  it('is 0 for an empty draft', () => {
    expect(draftSeatCount([])).toBe(0)
  })
})
