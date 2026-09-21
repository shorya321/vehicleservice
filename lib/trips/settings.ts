import { z } from 'zod'

/**
 * Admin-controlled trip-type settings, stored under `site_settings.config.trip_types`.
 *
 * Lives in `lib/trips` rather than `lib/site-settings` so the checkout, search
 * and hero can import the defaults without pulling the settings module in.
 */
export interface TripSettings {
  round_trip_enabled: boolean
  multi_city_enabled: boolean
  hourly_enabled: boolean
  /** Taken off the base fares of a round trip. 0 means no discount. */
  round_trip_discount_percent: number
  /** Most legs a multi-city trip may have. */
  multi_city_max_legs: number
  /** How far ahead an hourly hire must be booked. */
  hourly_min_notice_hours: number
  /** Gap required between one leg's estimated arrival and the next leg's pickup. */
  leg_buffer_minutes: number
}

export const DEFAULT_TRIP_SETTINGS: TripSettings = {
  round_trip_enabled: true,
  multi_city_enabled: true,
  hourly_enabled: true,
  round_trip_discount_percent: 0,
  multi_city_max_legs: 4,
  hourly_min_notice_hours: 12,
  leg_buffer_minutes: 60,
}

// Coerced because number inputs hand back strings.
export const tripSettingsSchema = z.object({
  round_trip_enabled: z.boolean(),
  multi_city_enabled: z.boolean(),
  hourly_enabled: z.boolean(),
  round_trip_discount_percent: z.coerce
    .number()
    .min(0, 'Cannot be negative')
    .max(50, 'Cannot exceed 50%'),
  multi_city_max_legs: z.coerce
    .number()
    .int('Enter a whole number')
    .min(2, 'At least 2 legs')
    .max(6, 'At most 6 legs'),
  hourly_min_notice_hours: z.coerce
    .number()
    .int('Enter a whole number of hours')
    .min(0, 'Cannot be negative')
    .max(168, 'Cannot exceed 168 hours (7 days)'),
  leg_buffer_minutes: z.coerce
    .number()
    .int('Enter a whole number of minutes')
    .min(0, 'Cannot be negative')
    .max(720, 'Cannot exceed 720 minutes'),
})

/**
 * Reads the stored value field by field, falling back to the default for any
 * key that is missing or out of range, so a partial or older config never
 * disables booking.
 */
export function parseTripSettings(raw: unknown): TripSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_TRIP_SETTINGS
  const obj = raw as Record<string, unknown>
  const result = { ...DEFAULT_TRIP_SETTINGS }
  const shape = tripSettingsSchema.shape

  for (const key of Object.keys(shape) as (keyof TripSettings)[]) {
    const parsed = shape[key].safeParse(obj[key])
    if (parsed.success && obj[key] !== undefined && obj[key] !== null) {
      ;(result as Record<keyof TripSettings, number | boolean>)[key] = parsed.data
    }
  }

  return result
}
