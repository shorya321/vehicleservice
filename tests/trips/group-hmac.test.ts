import {
  signBookingPayload,
  signGroupPayload,
  verifyBookingSignature,
  verifyGroupSignature,
} from '@/lib/security/booking-hmac'

const base = {
  groupId: 'g-1',
  totalPrice: 180,
  customerId: 'c-1',
  vehicleTypeId: 'v-1',
  legCount: 2,
}

describe('group HMAC', () => {
  beforeAll(() => {
    process.env.BOOKING_HMAC_SECRET = process.env.BOOKING_HMAC_SECRET || 'test-secret'
  })

  it('verifies its own signature', () => {
    const signed = signGroupPayload(base)
    expect(verifyGroupSignature({ ...base, ...signed })).toEqual({ valid: true })
  })

  it('rejects a changed total or leg count', () => {
    const signed = signGroupPayload(base)
    expect(verifyGroupSignature({ ...base, ...signed, totalPrice: 179.99 }).valid).toBe(false)
    expect(verifyGroupSignature({ ...base, ...signed, legCount: 3 }).valid).toBe(false)
  })

  it('expires after the TTL unless skipped', () => {
    const signed = signGroupPayload(base)
    const stale = { ...base, ...signed, timestamp: signed.timestamp - 31 * 60 * 1000 }
    expect(verifyGroupSignature(stale).reason).toBe('Signature expired')
    // Re-signing at the stale timestamp is what the skipTtl path relies on staying invalid.
    expect(verifyGroupSignature(stale, { skipTtl: true }).valid).toBe(false)
  })

  it('never crosses over with a single-booking signature', () => {
    const booking = signBookingPayload({ bookingId: 'g-1', totalPrice: 180, customerId: 'c-1', vehicleTypeId: 'v-1' })
    expect(verifyGroupSignature({ ...base, ...booking }).valid).toBe(false)
    const group = signGroupPayload(base)
    expect(
      verifyBookingSignature({ bookingId: 'g-1', totalPrice: 180, customerId: 'c-1', vehicleTypeId: 'v-1', ...group }).valid
    ).toBe(false)
  })
})
