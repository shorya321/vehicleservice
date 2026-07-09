/**
 * Shared phone number validation.
 *
 * Customer-facing phone inputs accept human formatting (spaces, dashes,
 * parentheses) but everything is normalized to E.164-ish before storage so a
 * single canonical value lands in the database.
 */

import { z } from 'zod';

/**
 * Matches a normalized number. An international number (`+` prefixed) is
 * E.164: no leading zero, 8-15 digits. A national number may keep its trunk
 * zero, e.g. `0501234567`.
 */
export const PHONE_REGEX = /^(?:\+[1-9]\d{7,14}|0?[1-9]\d{6,14})$/;

const PHONE_ERROR = 'Enter a valid phone number';

/**
 * Strips human formatting from a phone number, keeping only a leading `+`
 * and digits. Returns an empty string for blank input.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) return '';

  return hasPlus ? `+${digits}` : digits;
}

/** True when `raw` normalizes to a plausible phone number. */
export function isValidPhone(raw: string | null | undefined): boolean {
  return PHONE_REGEX.test(normalizePhone(raw));
}

/**
 * Normalizes `raw` and returns it, or `null` when it is not a phone number.
 * Use at any boundary that persists a phone value from untrusted input.
 */
export function toStoredPhone(raw: string | null | undefined): string | null {
  const normalized = normalizePhone(raw);
  return PHONE_REGEX.test(normalized) ? normalized : null;
}

/**
 * Drops characters that can never appear in a phone number. Wire this into
 * `onChange` so an email address cannot be typed or pasted into the field.
 */
export function sanitizePhoneInput(raw: string): string {
  const cleaned = raw.replace(/[^\d\s+()\-.]/g, '');
  // A `+` is only meaningful as a country-code prefix.
  return cleaned.startsWith('+')
    ? `+${cleaned.slice(1).replace(/\+/g, '')}`
    : cleaned.replace(/\+/g, '');
}

/**
 * Required phone for react-hook-form schemas. Validates without transforming,
 * so the inferred form type stays `string`. Normalize on the server instead.
 */
export const phoneField = z.string().refine(isValidPhone, PHONE_ERROR);

/** Optional phone for react-hook-form schemas. Blank is allowed. */
export const optionalPhoneField = z
  .string()
  .optional()
  .refine((value) => !value?.trim() || isValidPhone(value), PHONE_ERROR);

/** Required phone. Parses to the normalized form. */
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((value) => PHONE_REGEX.test(value), PHONE_ERROR);

/**
 * Optional phone. Blank input parses to `null`.
 *
 * The refine runs on the raw input: an email normalizes to an empty string,
 * so checking after the transform would wrongly read it as blank.
 */
export const optionalPhoneSchema = z
  .string()
  .optional()
  .nullable()
  .refine((value) => !value?.trim() || isValidPhone(value), PHONE_ERROR)
  .transform(toStoredPhone);
