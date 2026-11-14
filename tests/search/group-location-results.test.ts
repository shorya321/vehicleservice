/**
 * The search dropdown shows results in type groups. A strong hotel match must
 * not sit under weak airport or bus stop matches ("burj al arab" used to list
 * DWC, DXB and two bus stops above the hotel). The popular list carries no
 * relevance and keeps the fixed type order.
 */
import { groupLocationResults } from '@/lib/search/group-location-results'
import type { LocationSearchResult } from '@/lib/types/location'

function row(
  name: string,
  label: string,
  sort: number,
  relevance: number | undefined
): LocationSearchResult {
  return {
    id: name,
    name,
    address: null,
    city: 'Dubai',
    country_code: 'AE',
    slug: name.toLowerCase(),
    country_slug: 'united-arab-emirates',
    latitude: 25,
    longitude: 55,
    location_type_id: label,
    location_type_label: label,
    location_type_icon: 'map-pin',
    location_type_sort: sort,
    allow_pickup: true,
    allow_dropoff: true,
    relevance: relevance as number,
  } as LocationSearchResult
}

describe('groupLocationResults', () => {
  it('puts the group holding the best match first', () => {
    const groups = groupLocationResults([
      row('Burj Al Arab Corniche', 'Tourist Attraction', 30, 1.14),
      row('Jumeirah Burj Al Arab', 'Hotel', 10, 1.1),
      row('Burj Al Arab Hotel 1', 'Transport Hub', 5, 1.05),
      row('Dubai International Airport (DXB)', 'Airport', 1, 0.39),
    ])
    expect(groups.map((g) => g.label)).toEqual([
      'Tourist Attraction',
      'Hotel',
      'Transport Hub',
      'Airport',
    ])
  })

  it('keeps airports first when they are the best match', () => {
    const groups = groupLocationResults([
      row('Dubai Airports Cargo', 'Transport Hub', 5, 1.1),
      row('Dubai International Airport (DXB)', 'Airport', 1, 1.71),
    ])
    expect(groups[0].label).toBe('Airport')
  })

  it('falls back to type order on equal scores', () => {
    const groups = groupLocationResults([
      row('B', 'Resort', 11, 1),
      row('A', 'Hotel', 10, 1),
    ])
    expect(groups.map((g) => g.label)).toEqual(['Hotel', 'Resort'])
  })

  it('uses type order for the popular list, which has no relevance', () => {
    const groups = groupLocationResults([
      row('Jumeirah Burj Al Arab', 'Hotel', 10, undefined),
      row('Cruise Terminal', 'Tourist Attraction', 30, undefined),
      row('Dubai International Airport (DXB)', 'Airport', 1, undefined),
    ])
    expect(groups.map((g) => g.label)).toEqual(['Airport', 'Hotel', 'Tourist Attraction'])
  })

  it('keeps the RPC order inside a group and does not mutate input', () => {
    const input = [
      row('First hotel', 'Hotel', 10, 1.1),
      row('Second hotel', 'Hotel', 10, 0.9),
    ]
    const snapshot = JSON.stringify(input)
    const groups = groupLocationResults(input)
    expect(groups[0].locations.map((l) => l.name)).toEqual(['First hotel', 'Second hotel'])
    expect(JSON.stringify(input)).toBe(snapshot)
  })
})
