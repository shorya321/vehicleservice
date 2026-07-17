import { calculateAddonsTotal, calculateWizardTotal } from '@/lib/business/wizard-pricing'

describe('calculateAddonsTotal', () => {
  it('is 0 when no addons are selected', () => {
    expect(calculateAddonsTotal(undefined)).toBe(0)
    expect(calculateAddonsTotal([])).toBe(0)
  })

  it('sums the selected addons', () => {
    expect(calculateAddonsTotal([{ total_price: 15 }, { total_price: 25 }])).toBe(40)
  })
})

describe('calculateWizardTotal', () => {
  it('is the base price when there are no addons', () => {
    // The no-addon path. The vehicle step used to be the only writer of total_price, so this is the
    // case that breaks if the derivation is wrong: the API rejects a missing or zero total with 400.
    expect(calculateWizardTotal(100, undefined)).toBe(100)
    expect(calculateWizardTotal(100, [])).toBe(100)
  })

  it('adds the addons to the base price', () => {
    expect(calculateWizardTotal(100, [{ total_price: 15 }])).toBe(115)
  })

  it('mirrors the server: basePrice + addonsPrice (lib/business/price-calculation.ts)', () => {
    const basePrice = 90
    const addons = [{ total_price: 10 }, { total_price: 8 }]
    const serverTotal = basePrice + addons.reduce((s, a) => s + a.total_price, 0)
    // Divergence here is what trips the API's "SECURITY WARNING: Price discrepancy" log.
    expect(calculateWizardTotal(basePrice, addons)).toBe(serverTotal)
  })

  it('survives a vehicle change with addons already selected — the bug this fixes', () => {
    const addons = [{ total_price: 15 }]
    // Vehicle A, addons picked.
    expect(calculateWizardTotal(100, addons)).toBe(115)
    // Back -> reselect a different vehicle. Only base_price changes; the addons must persist in the
    // total, rather than it collapsing to the bare base price as it did when total_price was stored.
    expect(calculateWizardTotal(120, addons)).toBe(135)
  })

  it('treats a missing base price as 0 rather than NaN', () => {
    expect(calculateWizardTotal(undefined, [{ total_price: 15 }])).toBe(15)
  })
})
