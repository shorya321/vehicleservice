/**
 * Masking helpers for values that belong in the activity log by reference but
 * not in full.
 *
 * The log is exportable to CSV and is read by whoever the owner shares that file
 * with, so it must not become a second copy of the customer database. The full
 * values stay on the entity pages behind a deep link, which is the correct place
 * for them.
 *
 * Dependency-free so both the writer and the UI can use it.
 */

/** a****d@example.com - enough to recognise, not enough to harvest. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) return '***';

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);

  if (local.length <= 2) return `${local[0]}***${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}${domain}`;
}

/** Keeps the country prefix and the last four digits. */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 4) return '***';

  const last4 = digits.slice(-4);
  const prefix = trimmed.startsWith('+') ? `+${digits.slice(0, Math.min(3, digits.length - 4))}` : '';
  return `${prefix} ${'*'.repeat(3)} ${last4}`.trim();
}

/** Last four characters only. */
export function maskPlate(plate: string | null | undefined): string | null {
  if (!plate) return null;
  const trimmed = plate.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${'*'.repeat(3)}${trimmed.slice(-4)}`;
}

/**
 * Stripe identifiers: keep the last 8 characters for support correlation.
 * The full id is a lookup key into another system and does not belong here.
 */
export function maskStripeId(id: string | null | undefined): string | null {
  if (!id) return null;
  return id.length <= 8 ? id : id.slice(-8);
}

/**
 * DNS verification tokens are leverage for a domain claim, so only a short
 * prefix is ever recorded.
 */
export function maskToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return `${token.slice(0, 8)}...`;
}
