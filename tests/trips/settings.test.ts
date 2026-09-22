import { DEFAULT_TRIP_SETTINGS, parseTripSettings } from '@/lib/trips/settings'
import { parseSiteSettings } from '@/lib/site-settings/types'

describe('parseTripSettings', () => {
  it('returns the defaults for a missing value', () => {
    expect(parseTripSettings(undefined)).toEqual(DEFAULT_TRIP_SETTINGS)
    expect(parseTripSettings('nope')).toEqual(DEFAULT_TRIP_SETTINGS)
  })

  it('keeps valid keys and falls back per key for invalid ones', () => {
    expect(parseTripSettings({
      hourly_enabled: false,
      round_trip_discount_percent: 10,
      multi_city_max_legs: 99,
      leg_buffer_minutes: -5,
    })).toEqual({
      ...DEFAULT_TRIP_SETTINGS,
      hourly_enabled: false,
      round_trip_discount_percent: 10,
    })
  })

  it('is part of the site settings config, so an older config gets defaults', () => {
    expect(parseSiteSettings({ brand_name: 'X' }).trip_types).toEqual(DEFAULT_TRIP_SETTINGS)
  })
})
