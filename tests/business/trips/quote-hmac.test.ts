jest.mock('server-only', () => ({}), { virtual: true })

import {
  businessTripRouteKey,
  signBusinessTripQuote,
  verifyBusinessTripQuote,
} from '@/lib/business/trips/quote-hmac'

process.env.BOOKING_HMAC_SECRET = process.env.BOOKING_HMAC_SECRET || 'test-secret'

const payload = {
  tripType: 'round_trip',
  businessAccountId: 'acct-1',
  vehicleTypeId: 'veh-1',
  routeKey: businessTripRouteKey([{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }]),
  basePrice: 200,
}

describe('business trip quote signature', () => {
  it('verifies an untouched quote', () => {
    const signed = signBusinessTripQuote(payload)
    expect(verifyBusinessTripQuote({ ...payload, ...signed })).toEqual({ valid: true })
  })

  it('rejects a changed price, route, vehicle, account or trip type', () => {
    const signed = signBusinessTripQuote(payload)
    for (const tampered of [
      { basePrice: 199 },
      { routeKey: 'a>c,c>a' },
      { vehicleTypeId: 'veh-2' },
      { businessAccountId: 'acct-2' },
      { tripType: 'multi_city' },
    ]) {
      expect(verifyBusinessTripQuote({ ...payload, ...signed, ...tampered }).valid).toBe(false)
    }
  })

  it('expires after 30 minutes', () => {
    const signed = signBusinessTripQuote(payload)
    const later = signed.timestamp + 31 * 60 * 1000
    expect(verifyBusinessTripQuote({ ...payload, ...signed }, { now: later })).toEqual({
      valid: false,
      reason: 'Signature expired',
    })
  })

  it('keys hourly quotes on pickup and package', () => {
    expect(businessTripRouteKey([{ from: 'a' }], 'half_day')).toBe('a@half_day')
    expect(businessTripRouteKey([{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }])).toBe('a>b,b>c')
  })
})
