/**
 * Guest checkout primitives: the price-signature subject and the guest access cookie.
 */
process.env.BOOKING_HMAC_SECRET = 'test-booking-hmac-secret'

import {
  GUEST_ACCESS_TTL_MS,
  GUEST_COOKIE_MAX_ENTRIES,
  addGuestEntry,
  guestEntriesInclude,
  isValidGuestEntry,
  normaliseGuestEmail,
  readGuestCookie,
  signGuestEntry,
  signatureSubject,
  writeGuestCookie,
} from '@/lib/security/guest-checkout'
import { checkRateLimit, clearRateLimits } from '@/lib/security/rate-limit'
import { signBookingPayload, verifyBookingSignature } from '@/lib/security/booking-hmac'

const NOW = 1_800_000_000_000

describe('signatureSubject', () => {
  it('keeps the account id for a signed-in booking, so existing signatures still verify', () => {
    expect(signatureSubject({ customer_id: 'user-1', guest_email: null })).toBe('user-1')
    expect(signatureSubject({ customer_id: 'user-1', guest_email: 'x@y.com' })).toBe('user-1')
  })

  it('uses the normalised guest email when there is no account', () => {
    expect(signatureSubject({ customer_id: null, guest_email: ' Guest@Example.COM ' })).toBe('guest:guest@example.com')
  })

  it('returns null for a row with neither (an orphan, never a valid booking)', () => {
    expect(signatureSubject({ customer_id: null, guest_email: null })).toBeNull()
    expect(signatureSubject({ customer_id: null })).toBeNull()
  })

  it('a guest signature verifies with the same subject and fails with another', () => {
    const subject = signatureSubject({ customer_id: null, guest_email: 'guest@example.com' })!
    const signed = signBookingPayload({ bookingId: 'b1', totalPrice: 100, customerId: subject, vehicleTypeId: 'v1' })
    const base = { bookingId: 'b1', totalPrice: 100, vehicleTypeId: 'v1', ...signed }
    expect(verifyBookingSignature({ ...base, customerId: subject }).valid).toBe(true)
    expect(verifyBookingSignature({ ...base, customerId: 'guest:other@example.com' }).valid).toBe(false)
  })
})

describe('normaliseGuestEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseGuestEmail('  A@B.Com ')).toBe('a@b.com')
  })
})

describe('guest access entries', () => {
  it('a freshly signed entry is valid until it expires', () => {
    const entry = signGuestEntry('BK1700000000ABCDE', NOW)
    expect(entry.expiresAt).toBe(NOW + GUEST_ACCESS_TTL_MS)
    expect(isValidGuestEntry(entry, NOW + 1)).toBe(true)
    expect(isValidGuestEntry(entry, NOW + GUEST_ACCESS_TTL_MS)).toBe(false)
  })

  it('rejects a tampered reference, expiry or signature', () => {
    const entry = signGuestEntry('BK1700000000ABCDE', NOW)
    expect(isValidGuestEntry({ ...entry, reference: 'BK1700000000ZZZZZ' }, NOW)).toBe(false)
    expect(isValidGuestEntry({ ...entry, expiresAt: entry.expiresAt + 1000 }, NOW)).toBe(false)
    expect(isValidGuestEntry({ ...entry, signature: '0'.repeat(64) }, NOW)).toBe(false)
    expect(isValidGuestEntry({ ...entry, signature: 'not-hex' }, NOW)).toBe(false)
  })

  it('rejects a reference outside the booking-number alphabet', () => {
    const entry = signGuestEntry('bk1.~x', NOW)
    expect(isValidGuestEntry(entry, NOW)).toBe(false)
  })

  it('round-trips through the cookie value and drops junk', () => {
    const entries = addGuestEntry([], 'BK1700000000ABCDE', NOW)
    const value = writeGuestCookie(entries)
    expect(readGuestCookie(value, NOW)).toEqual(entries)
    expect(readGuestCookie(`${value}~garbage~a.b.c`, NOW)).toEqual(entries)
    expect(readGuestCookie(undefined, NOW)).toEqual([])
    expect(readGuestCookie('', NOW)).toEqual([])
  })

  it('a cookie signed with another secret grants nothing', () => {
    const value = writeGuestCookie(addGuestEntry([], 'BK1700000000ABCDE', NOW))
    process.env.BOOKING_HMAC_SECRET = 'a-different-secret'
    try {
      expect(readGuestCookie(value, NOW)).toEqual([])
    } finally {
      process.env.BOOKING_HMAC_SECRET = 'test-booking-hmac-secret'
    }
  })

  it('replaces an existing entry and keeps only the newest entries', () => {
    let entries = addGuestEntry([], 'GRA1', NOW)
    entries = addGuestEntry(entries, 'GRA1', NOW + 5)
    expect(entries).toHaveLength(1)
    expect(entries[0].expiresAt).toBe(NOW + 5 + GUEST_ACCESS_TTL_MS)

    for (let i = 0; i < GUEST_COOKIE_MAX_ENTRIES + 2; i += 1) {
      entries = addGuestEntry(entries, `BK${1000 + i}`, NOW)
    }
    expect(entries).toHaveLength(GUEST_COOKIE_MAX_ENTRIES)
    expect(guestEntriesInclude(entries, 'GRA1')).toBe(false)
    expect(guestEntriesInclude(entries, `BK${1000 + GUEST_COOKIE_MAX_ENTRIES + 1}`)).toBe(true)
  })

  it('does not mutate the entries it is given', () => {
    const original = addGuestEntry([], 'BK1', NOW)
    const snapshot = [...original]
    addGuestEntry(original, 'BK2', NOW)
    expect(original).toEqual(snapshot)
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => clearRateLimits())

  it('allows up to max attempts in a window, then refuses until it resets', () => {
    const options = { max: 2, windowMs: 1000 }
    expect(checkRateLimit('ip', options, NOW).allowed).toBe(true)
    expect(checkRateLimit('ip', options, NOW + 1).allowed).toBe(true)
    const blocked = checkRateLimit('ip', options, NOW + 2)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(checkRateLimit('other-ip', options, NOW + 2).allowed).toBe(true)
    expect(checkRateLimit('ip', options, NOW + 1000).allowed).toBe(true)
  })
})
