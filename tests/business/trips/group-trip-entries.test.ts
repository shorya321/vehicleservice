import { groupQuotationBookings } from '@/lib/business/bookings/group-quotation-bookings'
import { flattenListEntries, groupTripEntries, withWholeTrips } from '@/lib/business/bookings/group-trip-entries'
import { expandToWholeTrips, groupBusinessTripRows } from '@/lib/business/trips/group-rows'

interface Row {
  id: string
  pickup_datetime: string
  trip_type?: string
  booking_group_id?: string | null
  leg_index?: number | null
  booking_group?: { group_number: string; leg_count: number } | null
}

const group = { group_number: 'BG-1', leg_count: 2 }
const rows: Row[] = [
  { id: 'one', pickup_datetime: '2030-01-12T00:00:00Z' },
  { id: 'ret', pickup_datetime: '2030-01-11T14:00:00Z', trip_type: 'round_trip', booking_group_id: 'g1', leg_index: 1, booking_group: group },
  { id: 'out', pickup_datetime: '2030-01-11T06:00:00Z', trip_type: 'round_trip', booking_group_id: 'g1', leg_index: 0, booking_group: group },
  { id: 'hour', pickup_datetime: '2030-01-13T06:00:00Z', trip_type: 'hourly' },
]

describe('groupTripEntries', () => {
  it('folds a trip into one entry where its first row sat, in travel order', () => {
    const entries = groupTripEntries(groupQuotationBookings(rows, []))
    expect(entries.map((e) => e.kind)).toEqual(['single', 'trip', 'single'])
    const trip = entries[1]
    if (trip.kind !== 'trip') throw new Error('expected a trip')
    expect(trip).toMatchObject({ groupId: 'g1', groupNumber: 'BG-1', tripType: 'round_trip', legCount: 2 })
    expect(trip.bookings.map((b) => b.id)).toEqual(['out', 'ret'])
    expect(flattenListEntries(entries).map((b) => b.id)).toEqual(['one', 'out', 'ret', 'hour'])
  })

  it('leaves lists without trips untouched', () => {
    const plain = [rows[0], rows[3]]
    expect(groupTripEntries(groupQuotationBookings(plain, []))).toEqual(groupQuotationBookings(plain, []))
  })
})

describe('withWholeTrips', () => {
  it('brings the other journeys of a matched trip along', () => {
    expect(withWholeTrips(rows, [rows[1]]).map((r) => r.id)).toEqual(['ret', 'out'])
    expect(withWholeTrips(rows, [rows[0]]).map((r) => r.id)).toEqual(['one'])
  })
})

describe('groupBusinessTripRows / expandToWholeTrips', () => {
  it('folds legs and expands selections to whole trips', () => {
    const folded = groupBusinessTripRows(rows)
    expect(folded.map((r) => r.id)).toEqual(['one', 'out', 'hour'])
    expect(folded[1].trip_legs?.map((r) => r.id)).toEqual(['out', 'ret'])
    expect(expandToWholeTrips(['ret'], rows).sort()).toEqual(['out', 'ret'])
    expect(expandToWholeTrips(['one'], rows)).toEqual(['one'])
  })
})
