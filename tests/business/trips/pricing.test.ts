import { quoteBusinessTrip, toCents } from '@/lib/business/trips/pricing'
import { businessTripWizardTotal } from '@/lib/business/trips/wizard-total'

describe('quoteBusinessTrip', () => {
  it('sums journeys with no discount', () => {
    const quote = quoteBusinessTrip([{ baseFare: 100 }, { baseFare: 100 }], 0)
    expect(quote).toMatchObject({ subtotal: 200, discount: 0, total: 200 })
    expect(quote.legs.map((leg) => leg.total)).toEqual([100, 100])
  })

  it('discounts base fares only and charges add-ons on every journey', () => {
    const quote = quoteBusinessTrip(
      [{ baseFare: 100, addons: 8 }, { baseFare: 100, addons: 8 }],
      10
    )
    expect(quote.subtotal).toBe(216)
    expect(quote.discount).toBe(20)
    expect(quote.total).toBe(196)
    expect(quote.legs).toEqual([
      { base: 100, discount: 10, total: 98 },
      { base: 100, discount: 10, total: 98 },
    ])
  })

  it('puts the rounding remainder on the first journey so journeys sum to the total exactly', () => {
    const quote = quoteBusinessTrip([{ baseFare: 33.33 }, { baseFare: 33.33 }, { baseFare: 33.34 }], 7.5)
    const legCents = quote.legs.reduce((sum, leg) => sum + toCents(leg.total), 0)
    expect(legCents).toBe(toCents(quote.total))
    const discountCents = quote.legs.reduce((sum, leg) => sum + toCents(leg.discount), 0)
    expect(discountCents).toBe(toCents(quote.discount))
  })

  it('refuses an empty trip', () => {
    expect(() => quoteBusinessTrip([], 0)).toThrow()
  })
})

describe('businessTripWizardTotal', () => {
  it('charges add-ons once per journey, mirroring the create route', () => {
    expect(businessTripWizardTotal(200, 8, 2)).toBe(216)
    expect(businessTripWizardTotal(450, 0, 1)).toBe(450)
  })

  it('treats a missing base price as zero', () => {
    expect(businessTripWizardTotal(undefined, 5, 3)).toBe(15)
  })
})
