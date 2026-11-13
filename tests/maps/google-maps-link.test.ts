import { googleMapsUrl, normalizeFlightNumber } from '@/lib/maps/google-maps-link'

describe('googleMapsUrl', () => {
  it('builds a pin link with the place id', () => {
    const url = googleMapsUrl({ latitude: 25.130438, longitude: 55.117188, google_place_id: 'ChIJabc' })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=25.130438%2C55.117188&query_place_id=ChIJabc'
    )
  })

  it('accepts numeric strings from Postgres numeric columns', () => {
    expect(googleMapsUrl({ latitude: '25.2', longitude: '55.3' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=25.2%2C55.3'
    )
  })

  it('returns null without usable coordinates', () => {
    expect(googleMapsUrl(null)).toBeNull()
    expect(googleMapsUrl(undefined)).toBeNull()
    expect(googleMapsUrl({ latitude: null, longitude: 55 })).toBeNull()
    expect(googleMapsUrl({ latitude: '', longitude: '' })).toBeNull()
    expect(googleMapsUrl({ latitude: 'abc', longitude: 55 })).toBeNull()
    expect(googleMapsUrl({ latitude: 95, longitude: 55 })).toBeNull()
  })
})

describe('normalizeFlightNumber', () => {
  it('trims, collapses spaces and upper-cases', () => {
    expect(normalizeFlightNumber('  ek   123 ')).toBe('EK 123')
  })

  it('returns null for empty or one-character input', () => {
    expect(normalizeFlightNumber(undefined)).toBeNull()
    expect(normalizeFlightNumber('')).toBeNull()
    expect(normalizeFlightNumber('   ')).toBeNull()
    expect(normalizeFlightNumber('x')).toBeNull()
  })

  it('caps at 20 characters to satisfy the column check', () => {
    expect(normalizeFlightNumber('a'.repeat(40))).toHaveLength(20)
  })
})
