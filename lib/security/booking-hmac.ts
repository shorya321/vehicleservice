import crypto from 'crypto'

const SIGNATURE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function getSecret(): string {
  const secret = process.env.BOOKING_HMAC_SECRET
  if (!secret) {
    throw new Error('BOOKING_HMAC_SECRET environment variable is not set')
  }
  return secret
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex')
}

interface SignPayload {
  bookingId: string
  totalPrice: number
  customerId: string
  vehicleTypeId: string
}

interface SignResult {
  signature: string
  timestamp: number
  nonce: string
}

export function signBookingPayload(payload: SignPayload): SignResult {
  const timestamp = Date.now()
  const nonce = generateNonce()
  const message = [
    payload.bookingId,
    payload.totalPrice.toFixed(2),
    payload.customerId,
    payload.vehicleTypeId,
    timestamp.toString(),
    nonce,
  ].join('|')

  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(message)
    .digest('hex')

  return { signature, timestamp, nonce }
}

interface VerifyPayload extends SignPayload {
  signature: string
  timestamp: number
  nonce: string
}

export function verifyBookingSignature(payload: VerifyPayload, options?: { skipTtl?: boolean }): {
  valid: boolean
  reason?: string
} {
  // Check TTL unless explicitly skipped (e.g. at payment confirmation where freshness was already validated)
  if (!options?.skipTtl) {
    const age = Date.now() - payload.timestamp
    if (age > SIGNATURE_TTL_MS) {
      return { valid: false, reason: 'Signature expired' }
    }
  }

  // Recompute expected signature
  const message = [
    payload.bookingId,
    payload.totalPrice.toFixed(2),
    payload.customerId,
    payload.vehicleTypeId,
    payload.timestamp.toString(),
    payload.nonce,
  ].join('|')

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(message)
    .digest('hex')

  // Timing-safe comparison
  const sigBuffer = Buffer.from(payload.signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: 'Invalid signature length' }
  }

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  if (!isValid) {
    return { valid: false, reason: 'Signature mismatch' }
  }

  return { valid: true }
}

// ─── Business Quote Signing ───────────────────────────────────────────────────

interface BusinessQuotePayload {
  fromLocationId: string;
  toLocationId: string;
  vehicleTypeId: string;
  basePrice: number;
  businessAccountId: string;
}

interface BusinessQuoteSignResult {
  signature: string;
  timestamp: number;
  nonce: string;
}

export function signBusinessQuote(payload: BusinessQuotePayload): BusinessQuoteSignResult {
  const timestamp = Date.now()
  const nonce = generateNonce()
  const message = [
    payload.fromLocationId,
    payload.toLocationId,
    payload.vehicleTypeId,
    payload.basePrice.toFixed(2),
    payload.businessAccountId,
    timestamp.toString(),
    nonce,
  ].join('|')

  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(message)
    .digest('hex')

  return { signature, timestamp, nonce }
}

interface VerifyBusinessQuotePayload extends BusinessQuotePayload {
  signature: string;
  timestamp: number;
  nonce: string;
}

export function verifyBusinessQuoteSignature(payload: VerifyBusinessQuotePayload, options?: { skipTtl?: boolean }): {
  valid: boolean;
  reason?: string;
} {
  if (!options?.skipTtl) {
    const age = Date.now() - payload.timestamp
    if (age > SIGNATURE_TTL_MS) {
      return { valid: false, reason: 'Signature expired' }
    }
  }

  const message = [
    payload.fromLocationId,
    payload.toLocationId,
    payload.vehicleTypeId,
    payload.basePrice.toFixed(2),
    payload.businessAccountId,
    payload.timestamp.toString(),
    payload.nonce,
  ].join('|')

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(message)
    .digest('hex')

  const sigBuffer = Buffer.from(payload.signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: 'Invalid signature length' }
  }

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  if (!isValid) {
    return { valid: false, reason: 'Signature mismatch' }
  }

  return { valid: true }
}

/**
 * Verify that Stripe payment amount (in minor units/cents) matches the booking total price.
 * Stripe amounts are in cents, booking total_price is in major units (e.g., AED).
 */
export function verifyPaymentAmount(
  stripeAmountCents: number,
  bookingTotalPrice: number
): { valid: boolean; reason?: string } {
  const expectedCents = Math.round(bookingTotalPrice * 100)
  if (stripeAmountCents !== expectedCents) {
    return {
      valid: false,
      reason: `Amount mismatch: Stripe=${stripeAmountCents}, expected=${expectedCents}`,
    }
  }
  return { valid: true }
}
