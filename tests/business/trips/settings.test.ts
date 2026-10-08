import { DEFAULT_BUSINESS_TRIP_SETTINGS, parseBusinessTripSettings } from '@/lib/business/trips/settings'

describe('parseBusinessTripSettings', () => {
  it('falls back to defaults for missing or non-object config', () => {
    expect(parseBusinessTripSettings(undefined)).toEqual(DEFAULT_BUSINESS_TRIP_SETTINGS)
    expect(parseBusinessTripSettings('nope')).toEqual(DEFAULT_BUSINESS_TRIP_SETTINGS)
  })

  it('reads valid keys and keeps defaults for invalid ones', () => {
    const parsed = parseBusinessTripSettings({
      round_trip_enabled: false,
      hourly_enabled: 'yes',
      round_trip_discount_percent: '12.5',
      multi_city_max_legs: 9,
      hourly_min_notice_hours: 6,
      leg_buffer_minutes: 2.5,
    })
    expect(parsed).toEqual({
      ...DEFAULT_BUSINESS_TRIP_SETTINGS,
      round_trip_enabled: false,
      round_trip_discount_percent: 12.5,
      hourly_min_notice_hours: 6,
    })
  })
})
