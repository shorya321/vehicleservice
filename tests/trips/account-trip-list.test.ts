import { isStillAhead } from '@/components/account/trip-list'

const NOW = Date.parse('2026-09-23T12:00:00Z')
const at = (iso: string, booking_status = 'confirmed') => ({ pickup_datetime: iso, booking_status })

describe('isStillAhead', () => {
  it('reads a one-way booking by its own pickup', () => {
    expect(isStillAhead(at('2026-09-24T08:00:00Z'), NOW)).toBe(true)
    expect(isStillAhead(at('2026-09-22T08:00:00Z'), NOW)).toBe(false)
  })

  it('never counts a cancelled booking as ahead', () => {
    expect(isStillAhead(at('2026-09-24T08:00:00Z', 'cancelled'), NOW)).toBe(false)
  })

  it('keeps a trip upcoming while its return is still ahead', () => {
    const trip = { ...at('2026-09-20T08:00:00Z'), trip_legs: [at('2026-09-20T08:00:00Z'), at('2026-09-27T08:00:00Z')] }
    expect(isStillAhead(trip, NOW)).toBe(true)
  })

  it('moves a trip to travelled once every live journey has passed', () => {
    const trip = {
      ...at('2026-09-20T08:00:00Z'),
      trip_legs: [at('2026-09-20T08:00:00Z'), at('2026-09-27T08:00:00Z', 'cancelled')],
    }
    expect(isStillAhead(trip, NOW)).toBe(false)
  })
})
