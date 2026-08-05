import { formatChildAges } from '@/lib/utils/child-ages'
import { formatChildAges as formatChildAgesBusiness } from '@/lib/business/format-child-ages'

describe('formatChildAges', () => {
  // Everything downstream — the confirmation email, the confirmation page, the admin booking
  // detail — appends this to an add-on label. Returning '' for absent ages is what keeps every
  // pre-existing booking and every non-child add-on rendering exactly as it did before.
  it('renders nothing when there are no ages', () => {
    expect(formatChildAges(null)).toBe('')
    expect(formatChildAges(undefined)).toBe('')
    expect(formatChildAges([])).toBe('')
  })

  it('renders a single age in the singular', () => {
    expect(formatChildAges([6])).toBe(' (age 6)')
  })

  it('renders 0 as "<1" rather than a bare zero', () => {
    // 0 means "under 1"; printing "age 0" reads as missing data to an operator.
    expect(formatChildAges([0])).toBe(' (age <1)')
  })

  it('renders multiple ages in the plural, in seat order', () => {
    expect(formatChildAges([0, 4])).toBe(' (ages <1, 4)')
    expect(formatChildAges([7, 2, 11])).toBe(' (ages 7, 2, 11)')
  })

  it('handles the full stored range', () => {
    expect(formatChildAges([12])).toBe(' (age 12)')
  })
})

describe('business copy stays in step with the customer copy', () => {
  // The duplication between lib/utils/child-ages.ts and lib/business/format-child-ages.ts is
  // deliberate (the business module is independent), but the two must not drift silently — an
  // operator reading an admin booking detail should see the same string either way.
  it.each([[null], [[]], [[0]], [[6]], [[0, 4]], [[12, 1]]])(
    'produces identical output for %p',
    (ages) => {
      expect(formatChildAgesBusiness(ages as number[] | null)).toBe(
        formatChildAges(ages as number[] | null)
      )
    }
  )
})
