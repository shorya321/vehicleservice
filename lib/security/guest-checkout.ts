import crypto from 'crypto'

/**
 * Guest checkout primitives (customer side only; the business module keeps its own).
 *
 * A guest booking has no `customer_id`, so two things that used to key on it need a
 * stand-in:
 *  - the price signature subject (`signatureSubject`), and
 *  - proof that the browser paying for a booking is the one that created it
 *    (the guest access cookie, built from `signGuestEntry` / `readGuestCookie`).
 *
 * Pure functions only, so they run under Jest without Next.js.
 */

export const GUEST_COOKIE_NAME = 'guest_checkout'
/** How long a guest may take between booking and paying. */
export const GUEST_ACCESS_TTL_MS = 2 * 60 * 60 * 1000
/** A browser holds at most this many guest bookings at once; the oldest drop off. */
export const GUEST_COOKIE_MAX_ENTRIES = 5

/** Domain tag so a guest access MAC can never verify as a price signature, or the reverse. */
const DOMAIN_TAG = 'guest-checkout'
const ENTRY_SEPARATOR = '~'
const FIELD_SEPARATOR = '.'
const REFERENCE_PATTERN = /^[A-Z0-9]{4,40}$/

function getSecret(): string {
  const secret = process.env.BOOKING_HMAC_SECRET
  if (!secret) {
    throw new Error('BOOKING_HMAC_SECRET environment variable is not set')
  }
  return secret
}

/**
 * The customer field of a booking's price signature: the account id for a signed-in
 * booking (exactly what it always was, so existing signatures still verify), or
 * `guest:<email>` for a guest booking. Returns null when the row has neither, which
 * callers must treat as an invalid booking.
 */
export function signatureSubject(row: {
  customer_id: string | null
  guest_email?: string | null
}): string | null {
  if (row.customer_id) return row.customer_id
  const email = row.guest_email?.trim().toLowerCase()
  return email ? `guest:${email}` : null
}

/** Lowercased, trimmed email stored in `guest_email`. */
export function normaliseGuestEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mac(reference: string, expiresAt: number): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update([DOMAIN_TAG, reference, String(expiresAt)].join('|'))
    .digest('hex')
}

export interface GuestEntry {
  reference: string
  expiresAt: number
  signature: string
}

export function signGuestEntry(reference: string, now: number = Date.now()): GuestEntry {
  const expiresAt = now + GUEST_ACCESS_TTL_MS
  return { reference, expiresAt, signature: mac(reference, expiresAt) }
}

export function isValidGuestEntry(entry: GuestEntry, now: number = Date.now()): boolean {
  if (!REFERENCE_PATTERN.test(entry.reference)) return false
  if (!Number.isFinite(entry.expiresAt) || entry.expiresAt <= now) return false
  if (!/^[0-9a-f]{64}$/.test(entry.signature)) return false

  const expected = Buffer.from(mac(entry.reference, entry.expiresAt), 'hex')
  const given = Buffer.from(entry.signature, 'hex')
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}

/** Parses the cookie value, keeping only entries that are well formed, unexpired and authentic. */
export function readGuestCookie(value: string | undefined, now: number = Date.now()): GuestEntry[] {
  if (!value) return []
  return value
    .split(ENTRY_SEPARATOR)
    .map((raw): GuestEntry | null => {
      const [reference, expires, signature] = raw.split(FIELD_SEPARATOR)
      if (!reference || !expires || !signature) return null
      return { reference, expiresAt: Number(expires), signature }
    })
    .filter((entry): entry is GuestEntry => entry !== null && isValidGuestEntry(entry, now))
}

export function writeGuestCookie(entries: readonly GuestEntry[]): string {
  return entries
    .map((entry) => [entry.reference, String(entry.expiresAt), entry.signature].join(FIELD_SEPARATOR))
    .join(ENTRY_SEPARATOR)
}

/**
 * The cookie's entries after granting `reference`: its old entry (if any) is replaced,
 * the new one goes last, and only the newest `GUEST_COOKIE_MAX_ENTRIES` are kept.
 */
export function addGuestEntry(
  existing: readonly GuestEntry[],
  reference: string,
  now: number = Date.now()
): GuestEntry[] {
  const others = existing.filter((entry) => entry.reference !== reference)
  return [...others, signGuestEntry(reference, now)].slice(-GUEST_COOKIE_MAX_ENTRIES)
}

export function guestEntriesInclude(entries: readonly GuestEntry[], reference: string): boolean {
  return entries.some((entry) => entry.reference === reference)
}
