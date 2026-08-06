/**
 * Regression tests for the business price-quote HMAC.
 *
 * The business booking wizard mints one signed quote per vehicle type while listing vehicles for a
 * route, holds it in client state across three more wizard steps, and echoes it back on submit.
 * POST /api/business/bookings rejects a quote that does not verify with a 403 carrying
 * "Price quote verification failed. Please restart the booking."
 *
 * These lock the tuple the signature actually covers, so a future change to either side of
 * sign/verify cannot silently drift. The route-change case is the one that shipped as a bug: the
 * Vehicle step kept a stale selection after the user went Back and changed the route, so a
 * signature minted for the previous route reached the API.
 */

// Must be set before the HMAC module reads it.
process.env.BOOKING_HMAC_SECRET = 'test-booking-hmac-secret'

import { signBusinessQuote, verifyBusinessQuoteSignature } from '@/lib/security/booking-hmac'

const SIGNATURE_TTL_MS = 30 * 60 * 1000

const QUOTE = {
  fromLocationId: '11111111-1111-4111-8111-111111111111',
  toLocationId: '22222222-2222-4222-8222-222222222222',
  vehicleTypeId: '33333333-3333-4333-8333-333333333333',
  basePrice: 250.75,
  businessAccountId: '44444444-4444-4444-8444-444444444444',
}

describe('business price quote HMAC', () => {
  it('verifies a freshly signed quote', () => {
    const signed = signBusinessQuote(QUOTE)

    expect(verifyBusinessQuoteSignature({ ...QUOTE, ...signed })).toEqual({ valid: true })
  })

  it('mints a distinct nonce per call so the replay index can do its job', () => {
    const first = signBusinessQuote(QUOTE)
    const second = signBusinessQuote(QUOTE)

    expect(first.nonce).not.toBe(second.nonce)
    expect(first.signature).not.toBe(second.signature)
  })

  it('tolerates float noise, because both sides round to 2dp', () => {
    // 100 * 2.5075 does not land exactly on 250.75 in binary floating point.
    const signed = signBusinessQuote({ ...QUOTE, basePrice: 100 * 2.5075 })

    expect(verifyBusinessQuoteSignature({ ...QUOTE, ...signed, basePrice: 250.75 }).valid).toBe(true)
  })

  describe('rejects a quote that no longer describes the booking', () => {
    it('when the drop-off location changed (the wizard back-navigation bug)', () => {
      const signed = signBusinessQuote(QUOTE)

      const result = verifyBusinessQuoteSignature({
        ...QUOTE,
        ...signed,
        toLocationId: '55555555-5555-4555-8555-555555555555',
      })

      expect(result).toEqual({ valid: false, reason: 'Signature mismatch' })
    })

    it('when the pickup location changed', () => {
      const signed = signBusinessQuote(QUOTE)

      expect(
        verifyBusinessQuoteSignature({
          ...QUOTE,
          ...signed,
          fromLocationId: '55555555-5555-4555-8555-555555555555',
        }).valid
      ).toBe(false)
    })

    it('when the vehicle type changed', () => {
      const signed = signBusinessQuote(QUOTE)

      expect(
        verifyBusinessQuoteSignature({
          ...QUOTE,
          ...signed,
          vehicleTypeId: '55555555-5555-4555-8555-555555555555',
        }).valid
      ).toBe(false)
    })

    it('when the base price was tampered with', () => {
      const signed = signBusinessQuote(QUOTE)

      expect(
        verifyBusinessQuoteSignature({ ...QUOTE, ...signed, basePrice: 1 }).valid
      ).toBe(false)
    })

    it('when the quote belongs to a different business account', () => {
      const signed = signBusinessQuote(QUOTE)

      expect(
        verifyBusinessQuoteSignature({
          ...QUOTE,
          ...signed,
          businessAccountId: '55555555-5555-4555-8555-555555555555',
        }).valid
      ).toBe(false)
    })

    it('when the signature is not valid hex of the right length', () => {
      const signed = signBusinessQuote(QUOTE)

      expect(
        verifyBusinessQuoteSignature({ ...QUOTE, ...signed, signature: 'abcd' })
      ).toEqual({ valid: false, reason: 'Invalid signature length' })
    })
  })

  describe('TTL', () => {
    it('rejects a quote older than 30 minutes', () => {
      const signed = signBusinessQuote(QUOTE)

      const result = verifyBusinessQuoteSignature({
        ...QUOTE,
        ...signed,
        timestamp: signed.timestamp - SIGNATURE_TTL_MS - 1000,
      })

      expect(result).toEqual({ valid: false, reason: 'Signature expired' })
    })

    it('cannot be kept alive by backdating the timestamp, because the MAC covers it', () => {
      const timestamp = Date.now() - (SIGNATURE_TTL_MS - 60_000)
      const signed = signBusinessQuote(QUOTE)

      // Inside the TTL window, so the clock gate passes - and the MAC still catches the edit.
      expect(
        verifyBusinessQuoteSignature({
          ...QUOTE,
          ...signed,
          timestamp,
        }).reason
      ).toBe('Signature mismatch')
    })

    it('skips the TTL check when asked to', () => {
      const signed = signBusinessQuote(QUOTE)
      const expired = { ...QUOTE, ...signed, timestamp: signed.timestamp - SIGNATURE_TTL_MS - 1000 }

      // Still invalid, but now for the MAC reason rather than the clock - proving skipTtl bypasses
      // only the expiry gate.
      expect(verifyBusinessQuoteSignature(expired, { skipTtl: true }).reason).toBe(
        'Signature mismatch'
      )
    })
  })
})
