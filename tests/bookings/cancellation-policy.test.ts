import {
  FREE_CANCELLATION_HOURS,
  FREE_CANCELLATION_WINDOW_MS,
  freeCancellationDeadline,
  isFreeCancellationAvailable,
} from '@/lib/bookings/cancellation-policy'

const NOW = new Date('2026-11-26T10:00:00.000Z').getTime()
const HOUR = 60 * 60 * 1000

describe('cancellation policy', () => {
  it('uses a 24 hour window', () => {
    expect(FREE_CANCELLATION_HOURS).toBe(24)
    expect(FREE_CANCELLATION_WINDOW_MS).toBe(24 * HOUR)
  })

  it('allows free cancellation more than 24 hours before pickup', () => {
    const pickup = new Date(NOW + 25 * HOUR).toISOString()
    expect(isFreeCancellationAvailable(pickup, NOW)).toBe(true)
  })

  it('refuses at exactly 24 hours before pickup', () => {
    const pickup = new Date(NOW + 24 * HOUR).toISOString()
    expect(isFreeCancellationAvailable(pickup, NOW)).toBe(false)
  })

  it('refuses inside 24 hours of pickup', () => {
    const pickup = new Date(NOW + 23 * HOUR + 59 * 60 * 1000).toISOString()
    expect(isFreeCancellationAvailable(pickup, NOW)).toBe(false)
  })

  it('refuses a pickup in the past', () => {
    const pickup = new Date(NOW - HOUR).toISOString()
    expect(isFreeCancellationAvailable(pickup, NOW)).toBe(false)
  })

  it('refuses a missing or unparseable pickup', () => {
    expect(isFreeCancellationAvailable(null, NOW)).toBe(false)
    expect(isFreeCancellationAvailable(undefined, NOW)).toBe(false)
    expect(isFreeCancellationAvailable('not a date', NOW)).toBe(false)
  })

  it('accepts a Date as well as an ISO string', () => {
    expect(isFreeCancellationAvailable(new Date(NOW + 48 * HOUR), NOW)).toBe(true)
  })

  it('puts the deadline 24 hours before pickup', () => {
    const pickup = '2026-11-28T06:00:00.000Z'
    expect(freeCancellationDeadline(pickup)?.toISOString()).toBe('2026-11-27T06:00:00.000Z')
    expect(freeCancellationDeadline(null)).toBeNull()
  })
})
