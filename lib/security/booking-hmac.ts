import crypto from 'crypto'

const HMAC_SECRET = process.env.BOOKING_HMAC_SECRET
const SIGNATURE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function getSecret(): string {
  if (!HMAC_SECRET) {
    throw new Error('BOOKING_HMAC_SECRET environment variable is not set')
  }
  return HMAC_SECRET
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

export function verifyBookingSignature(payload: VerifyPayload): {
  valid: boolean
  reason?: string
} {
  // Check TTL
  const age = Date.now() - payload.timestamp
  if (age > SIGNATURE_TTL_MS) {
    return { valid: false, reason: 'Signature expired' }
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
