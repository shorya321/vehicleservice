import { journeyTabs, viewingJourney } from '@/lib/trips/journey-tabs'
import type { AdminTripGroup, AdminTripLeg } from '@/lib/trips/admin-types'

const leg = (id: string, leg_index: number, over: Partial<AdminTripLeg> = {}): AdminTripLeg => ({
  id,
  booking_number: `BK-${id}`,
  trip_number: `TRIP-${id}`,
  leg_index,
  pickup_address: 'A',
  dropoff_address: 'B',
  pickup_datetime: '2026-10-01T10:00:00Z',
  booking_status: 'confirmed',
  payment_status: 'completed',
  total_price: 100,
  discount_amount: 0,
  refund_due: null,
  assignment_status: null,
  vendor_name: null,
  ...over,
})

const group = (trip_type: string, legs: AdminTripLeg[]): AdminTripGroup => ({
  id: 'g1',
  group_number: 'GRP-1',
  trip_type,
  leg_count: legs.length,
  subtotal: 200,
  discount_percent: 0,
  discount_amount: 0,
  total_price: 200,
  payment_status: 'completed',
  booking_status: 'confirmed',
  paid_at: null,
  stripe_payment_intent_id: null,
  legs,
})

describe('journeyTabs', () => {
  it('labels a round trip Outbound and Return and marks the one being viewed', () => {
    const tabs = journeyTabs(group('round_trip', [leg('o', 0), leg('r', 1)]), 'r')
    expect(tabs.map((t) => t.label)).toEqual(['Outbound', 'Return'])
    expect(tabs.map((t) => t.current)).toEqual([false, true])
    expect(tabs[0].href).toBe('/admin/bookings/o')
    expect(tabs[1].reference).toBe('TRIP-r')
  })

  it('labels multi-city journeys with their position', () => {
    const tabs = journeyTabs(group('multi_city', [leg('a', 0), leg('b', 1), leg('c', 2)]), 'a')
    expect(tabs.map((t) => t.label)).toEqual(['Journey 1 of 3', 'Journey 2 of 3', 'Journey 3 of 3'])
  })

  it('reports vendor state per journey, cancelled winning over assignment', () => {
    const tabs = journeyTabs(
      group('multi_city', [
        leg('a', 0, { assignment_status: 'accepted', vendor_name: 'V' }),
        leg('b', 1),
        leg('c', 2, { booking_status: 'cancelled', assignment_status: 'pending' }),
      ]),
      'a',
    )
    expect(tabs.map((t) => t.state)).toEqual(['assigned', 'unassigned', 'cancelled'])
  })

  it('falls back to the booking number when a journey has no trip number', () => {
    const tabs = journeyTabs(group('round_trip', [leg('o', 0, { trip_number: null }), leg('r', 1)]), 'o')
    expect(tabs[0].reference).toBe('BK-o')
  })
})

describe('viewingJourney', () => {
  it('names the journey being viewed', () => {
    expect(viewingJourney(group('round_trip', [leg('o', 0), leg('r', 1)]), 'r')).toBe('Return')
  })

  it('is null when the booking is not one of the journeys', () => {
    expect(viewingJourney(group('round_trip', [leg('o', 0)]), 'zzz')).toBeNull()
  })
})
