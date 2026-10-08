/**
 * Trip-type settings for the business portal.
 * SCOPE: Business module ONLY. Business twin of lib/trips/settings.ts. Do not de-duplicate.
 *
 * The values themselves are the admin's Settings > General trip-types card, stored under
 * `site_settings.config.trip_types`, so one admin switch governs both portals. Only the
 * parsing is duplicated here.
 */
export interface BusinessTripSettings {
  round_trip_enabled: boolean;
  multi_city_enabled: boolean;
  hourly_enabled: boolean;
  round_trip_discount_percent: number;
  multi_city_max_legs: number;
  hourly_min_notice_hours: number;
  leg_buffer_minutes: number;
}

export const DEFAULT_BUSINESS_TRIP_SETTINGS: BusinessTripSettings = {
  round_trip_enabled: true,
  multi_city_enabled: true,
  hourly_enabled: true,
  round_trip_discount_percent: 0,
  multi_city_max_legs: 4,
  hourly_min_notice_hours: 12,
  leg_buffer_minutes: 60,
};

type NumberKey = 'round_trip_discount_percent' | 'multi_city_max_legs' | 'hourly_min_notice_hours' | 'leg_buffer_minutes';
type BooleanKey = 'round_trip_enabled' | 'multi_city_enabled' | 'hourly_enabled';

const NUMBER_BOUNDS: Record<NumberKey, { min: number; max: number; integer: boolean }> = {
  round_trip_discount_percent: { min: 0, max: 50, integer: false },
  multi_city_max_legs: { min: 2, max: 6, integer: true },
  hourly_min_notice_hours: { min: 0, max: 168, integer: true },
  leg_buffer_minutes: { min: 0, max: 720, integer: true },
};

const BOOLEAN_KEYS: BooleanKey[] = ['round_trip_enabled', 'multi_city_enabled', 'hourly_enabled'];

function readNumber(value: unknown, key: NumberKey): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const { min, max, integer } = NUMBER_BOUNDS[key];
  if (n < min || n > max) return null;
  if (integer && !Number.isInteger(n)) return null;
  return n;
}

/**
 * Field by field, falling back to the default for any key that is missing or out of range,
 * so a partial or older config never disables booking.
 */
export function parseBusinessTripSettings(raw: unknown): BusinessTripSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BUSINESS_TRIP_SETTINGS };
  const obj = raw as Record<string, unknown>;
  const result: BusinessTripSettings = { ...DEFAULT_BUSINESS_TRIP_SETTINGS };

  for (const key of BOOLEAN_KEYS) {
    if (typeof obj[key] === 'boolean') result[key] = obj[key] as boolean;
  }
  for (const key of Object.keys(NUMBER_BOUNDS) as NumberKey[]) {
    const parsed = readNumber(obj[key], key);
    if (parsed !== null) result[key] = parsed;
  }
  return result;
}
