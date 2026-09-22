import {
  appendTripSearchParams,
  parseLegs,
  parseTripSearchParams,
  serializeLegs,
} from '@/lib/trips/search-params'
import type { TripSearchParams } from '@/lib/trips/types'

function roundTrip(trip: TripSearchParams): TripSearchParams {
  const params = new URLSearchParams()
  appendTripSearchParams(params, trip)
  // Next hands pages decoded values; URLSearchParams.get decodes the same way.
  const raw: Record<string, string> = {}
  params.forEach((value, key) => {
    raw[key] = value
  })
  return parseTripSearchParams(raw)
}

describe('trip search params', () => {
  it('writes nothing for one way, so one-way URLs stay unchanged', () => {
    const params = new URLSearchParams()
    appendTripSearchParams(params, { trip: 'one_way' })
    expect(params.toString()).toBe('')
  })

  it('round-trips a round trip with and without a return time', () => {
    expect(roundTrip({ trip: 'round_trip', returnDate: '2026-10-05' })).toEqual({
      trip: 'round_trip',
      returnDate: '2026-10-05',
    })
    expect(roundTrip({ trip: 'round_trip', returnDate: '2026-10-05', returnTime: '18:30' })).toEqual({
      trip: 'round_trip',
      returnDate: '2026-10-05',
      returnTime: '18:30',
    })
  })

  it('round-trips hourly and defaults a bad package to half day', () => {
    expect(roundTrip({ trip: 'hourly', hourlyPackage: 'full_day' })).toEqual({
      trip: 'hourly',
      hourlyPackage: 'full_day',
    })
    expect(parseTripSearchParams({ trip: 'hourly', package: 'weekend' })).toEqual({
      trip: 'hourly',
      hourlyPackage: 'half_day',
    })
  })

  it('round-trips multi-city legs, including slugs that contain -to- and a leading dash', () => {
    const legs = [
      { from: 'dubai-to-go-hub', to: '-dubai-12', date: '2026-10-01' },
      { from: '-dubai-12', to: 'abu-dhabi', date: '2026-10-02', time: '09:15' },
    ]
    expect(roundTrip({ trip: 'multi_city', legs })).toEqual({ trip: 'multi_city', legs })
    expect(serializeLegs(legs)).toBe('dubai-to-go-hub~-dubai-12@2026-10-01,-dubai-12~abu-dhabi@2026-10-02@09:15')
  })

  it('falls back to one way on a malformed or incomplete trip', () => {
    expect(parseTripSearchParams({})).toEqual({ trip: 'one_way' })
    expect(parseTripSearchParams({ trip: 'teleport' })).toEqual({ trip: 'one_way' })
    expect(parseTripSearchParams({ trip: 'round_trip' })).toEqual({ trip: 'one_way' })
    expect(parseTripSearchParams({ trip: 'round_trip', return: '05/10/2026' })).toEqual({ trip: 'one_way' })
    expect(parseTripSearchParams({ trip: 'multi_city', legs: 'a~b@2026-10-01' })).toEqual({ trip: 'one_way' })
  })

  it('reads the first value when a key repeats', () => {
    expect(parseTripSearchParams({ trip: ['hourly', 'round_trip'], package: ['full_day'] })).toEqual({
      trip: 'hourly',
      hourlyPackage: 'full_day',
    })
  })

  it('rejects tampered legs', () => {
    expect(parseLegs('a~a@2026-10-01,b~c@2026-10-02')).toBeNull()
    expect(parseLegs('a~b@2026-10-01,B~c@2026-10-02')).toBeNull()
    expect(parseLegs('a~b~c@2026-10-01,b~c@2026-10-02')).toBeNull()
    expect(parseLegs('a~b@2026-10-01@25:00,b~c@2026-10-02')).toBeNull()
    expect(parseLegs(Array.from({ length: 7 }, () => 'a~b@2026-10-01').join(','))).toBeNull()
  })
  it('never reads a return dated before the departure', () => {
    expect(
      parseTripSearchParams({ trip: 'round_trip', date: '2026-09-30', return: '2026-09-28' })
    ).toEqual({ trip: 'round_trip', returnDate: '2026-09-30' })
    expect(
      parseTripSearchParams({ trip: 'round_trip', date: '2026-09-28', return: '2026-09-30' })
    ).toEqual({ trip: 'round_trip', returnDate: '2026-09-30' })
  })

  it('never reads a journey dated before the one it follows', () => {
    const parsed = parseTripSearchParams({
      trip: 'multi_city',
      legs: 'a~b@2026-10-05@09:00,b~c@2026-10-01,c~d@2026-10-07',
    })
    expect(parsed.legs?.map((leg) => leg.date)).toEqual(['2026-10-05', '2026-10-05', '2026-10-07'])
    expect(parsed.legs?.[0].time).toBe('09:00')
  })
})
