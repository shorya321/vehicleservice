import 'server-only';
import crypto from 'crypto';

/**
 * Signs the price a business saw for a trip, so the create route charges exactly that or refuses.
 * SCOPE: Business module ONLY.
 *
 * Same secret and TTL as the one-way business quote (lib/security/booking-hmac.ts), but its own
 * message tag, so a trip signature can never verify as a one-way quote or the reverse.
 */
const TRIP_SIGNATURE_TTL_MS = 30 * 60 * 1000;
const MESSAGE_TAG = 'business-trip';

function getSecret(): string {
  const secret = process.env.BOOKING_HMAC_SECRET;
  if (!secret) throw new Error('BOOKING_HMAC_SECRET environment variable is not set');
  return secret;
}

export interface BusinessTripQuotePayload {
  tripType: string;
  businessAccountId: string;
  vehicleTypeId: string;
  /** Journeys as `from>to`, or `from@package` for hourly. See `businessTripRouteKey`. */
  routeKey: string;
  /** Trip fares after any discount, before add-ons. */
  basePrice: number;
}

export interface BusinessTripQuoteSignature {
  signature: string;
  timestamp: number;
  nonce: string;
}

/** A stable description of the route the price was quoted for. */
export function businessTripRouteKey(
  legs: Array<{ from: string; to?: string | null }>,
  hourlyPackage?: string | null
): string {
  if (hourlyPackage) return `${legs[0]?.from ?? ''}@${hourlyPackage}`;
  return legs.map((leg) => `${leg.from}>${leg.to ?? ''}`).join(',');
}

function message(payload: BusinessTripQuotePayload, timestamp: number, nonce: string): string {
  return [
    MESSAGE_TAG,
    payload.tripType,
    payload.businessAccountId,
    payload.vehicleTypeId,
    payload.routeKey,
    payload.basePrice.toFixed(2),
    timestamp.toString(),
    nonce,
  ].join('|');
}

export function signBusinessTripQuote(payload: BusinessTripQuotePayload): BusinessTripQuoteSignature {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', getSecret()).update(message(payload, timestamp, nonce)).digest('hex');
  return { signature, timestamp, nonce };
}

export function verifyBusinessTripQuote(
  payload: BusinessTripQuotePayload & BusinessTripQuoteSignature,
  options: { now?: number } = {}
): { valid: boolean; reason?: string } {
  const now = options.now ?? Date.now();
  if (now - payload.timestamp > TRIP_SIGNATURE_TTL_MS) return { valid: false, reason: 'Signature expired' };

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(message(payload, payload.timestamp, payload.nonce))
    .digest('hex');

  const given = Buffer.from(payload.signature, 'hex');
  const wanted = Buffer.from(expected, 'hex');
  if (given.length !== wanted.length) return { valid: false, reason: 'Invalid signature length' };
  return crypto.timingSafeEqual(given, wanted) ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
}
