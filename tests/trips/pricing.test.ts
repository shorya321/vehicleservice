import { cancellationRefundDue, quoteTrip, toCents } from '@/lib/trips/pricing'

describe('quoteTrip', () => {
  it('sums legs with no discount', () => {
    const quote = quoteTrip([{ baseFare: 150 }, { baseFare: 150 }], 0)
    expect(quote.subtotal).toBe(300)
    expect(quote.discount).toBe(0)
    expect(quote.total).toBe(300)
    expect(quote.legs.map((leg) => leg.total)).toEqual([150, 150])
  })

  it('applies the discount to base fares only, not add-ons', () => {
    const quote = quoteTrip(
      [{ baseFare: 100, addons: 20 }, { baseFare: 100, addons: 20 }],
      10
    )
    expect(quote.subtotal).toBe(240)
    expect(quote.discount).toBe(20)
    expect(quote.total).toBe(220)
    expect(quote.legs).toEqual([
      { base: 100, discount: 10, total: 110 },
      { base: 100, discount: 10, total: 110 },
    ])
  })

  it('puts the rounding remainder on the first leg so legs sum exactly to the total', () => {
    const quote = quoteTrip(
      [{ baseFare: 33.33 }, { baseFare: 33.33 }, { baseFare: 33.34 }],
      7.5
    )
    const legCents = quote.legs.reduce((sum, leg) => sum + toCents(leg.total), 0)
    const discountCents = quote.legs.reduce((sum, leg) => sum + toCents(leg.discount), 0)
    expect(legCents).toBe(toCents(quote.total))
    expect(discountCents).toBe(toCents(quote.discount))
    expect(quote.discount).toBe(7.5)
  })

  it('keeps float noise out of cents for uneven fares', () => {
    const quote = quoteTrip([{ baseFare: 0.1 * 3 }, { baseFare: 0.2 }], 0)
    expect(quote.total).toBe(0.5)
  })

  it('clamps the discount percent into range', () => {
    expect(quoteTrip([{ baseFare: 100 }, { baseFare: 100 }], -5).discount).toBe(0)
    expect(quoteTrip([{ baseFare: 100 }, { baseFare: 100 }], 150).total).toBe(0)
  })

  it('rejects an empty trip', () => {
    expect(() => quoteTrip([], 0)).toThrow()
  })
})

describe('cancellationRefundDue', () => {
  const discounted = [
    { total: 90, discount: 10, cancelled: false, refundDue: null },
    { total: 90, discount: 10, cancelled: false, refundDue: null },
  ]

  it('forfeits the remaining legs discount when the first leg is cancelled', () => {
    expect(cancellationRefundDue(discounted, 0)).toBe(80)
  })

  it('refunds the rest once every leg is cancelled', () => {
    const afterFirst = [
      { ...discounted[0], cancelled: true, refundDue: 80 },
      discounted[1],
    ]
    expect(cancellationRefundDue(afterFirst, 1)).toBe(100)
  })

  it('refunds a leg in full when there was no discount', () => {
    const plain = [
      { total: 120, discount: 0, cancelled: false, refundDue: null },
      { total: 80, discount: 0, cancelled: false, refundDue: null },
      { total: 60, discount: 0, cancelled: false, refundDue: null },
    ]
    expect(cancellationRefundDue(plain, 1)).toBe(80)
  })

  it('returns 0 for a leg already cancelled or out of range', () => {
    expect(cancellationRefundDue([{ ...discounted[0], cancelled: true, refundDue: 80 }, discounted[1]], 0)).toBe(0)
    expect(cancellationRefundDue(discounted, 5)).toBe(0)
  })

  it('never returns a negative refund', () => {
    const heavy = [
      { total: 10, discount: 40, cancelled: false, refundDue: null },
      { total: 10, discount: 40, cancelled: false, refundDue: null },
    ]
    expect(cancellationRefundDue(heavy, 0)).toBe(0)
  })
})
