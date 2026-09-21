import { validateHourlyStart, validateLegTiming, validatePickupStart } from '@/lib/trips/validation'
import { setBookingTimezone } from '@/lib/utils/timezone'

// 2026-10-01 08:00 in Dubai (UTC+4).
const NOW = new Date('2026-10-01T04:00:00Z')

beforeAll(() => setBookingTimezone('Asia/Dubai'))
afterAll(() => setBookingTimezone(null))

const options = { bufferMinutes: 60, maxLegs: 4, now: NOW }

describe('validateLegTiming', () => {
  it('accepts a return after the outbound arrival plus the buffer', () => {
    const legs = [
      { fromId: 'a', toId: 'b', date: '2026-10-02', time: '10:00', durationMinutes: 45 },
      { fromId: 'b', toId: 'a', date: '2026-10-02', time: '11:45' },
    ]
    expect(validateLegTiming(legs, options)).toBeNull()
  })

  it('rejects a return inside the buffer and says how much later to move it', () => {
    const legs = [
      { fromId: 'a', toId: 'b', date: '2026-10-02', time: '10:00', durationMinutes: 45 },
      { fromId: 'b', toId: 'a', date: '2026-10-02', time: '11:15' },
    ]
    expect(validateLegTiming(legs, options)).toBe(
      'Journey 2 starts too soon after journey 1. Move it at least 30 minutes later.'
    )
  })

  it('uses a 60 minute default when the route has no duration', () => {
    const legs = [
      { fromId: 'a', toId: 'b', date: '2026-10-02', time: '10:00' },
      { fromId: 'b', toId: 'a', date: '2026-10-02', time: '11:59' },
    ]
    expect(validateLegTiming(legs, options)).toBe(
      'Journey 2 starts too soon after journey 1. Move it at least 1 minute later.'
    )
  })

  it('rejects a return before the outbound', () => {
    const legs = [
      { fromId: 'a', toId: 'b', date: '2026-10-03', time: '10:00' },
      { fromId: 'b', toId: 'a', date: '2026-10-02', time: '10:00' },
    ]
    expect(validateLegTiming(legs, options)).toMatch(/^Journey 2 starts too soon/)
  })

  it('rejects a pickup already past in the operating timezone', () => {
    // 07:30 Dubai on the same day is 30 minutes in the past, even though the
    // UTC clock reads 04:00.
    const legs = [
      { fromId: 'a', toId: 'b', date: '2026-10-01', time: '07:30' },
      { fromId: 'b', toId: 'a', date: '2026-10-03', time: '10:00' },
    ]
    expect(validateLegTiming(legs, options)).toBe('Journey 1: the pickup time has already passed.')
  })

  it('enforces distinct endpoints, a leg count, and the admin maximum', () => {
    expect(validateLegTiming([{ fromId: 'a', toId: 'b', date: '2026-10-02', time: '10:00' }], options))
      .toBe('Add at least two journeys.')
    expect(validateLegTiming([
      { fromId: 'a', toId: 'a', date: '2026-10-02', time: '10:00' },
      { fromId: 'b', toId: 'c', date: '2026-10-03', time: '10:00' },
    ], options)).toBe('Journey 1: pickup and destination must differ.')
    const five = Array.from({ length: 5 }, (_, index) => ({
      fromId: `l${index}`, toId: `l${index + 1}`, date: `2026-10-0${index + 2}`, time: '10:00',
    }))
    expect(validateLegTiming(five, options)).toBe('A trip can hold at most 4 journeys.')
  })

  it('rejects malformed dates and times', () => {
    expect(validateLegTiming([
      { fromId: 'a', toId: 'b', date: '2026-10-02', time: '9am' },
      { fromId: 'b', toId: 'a', date: '2026-10-03', time: '10:00' },
    ], options)).toBe('Journey 1: choose a valid date and time.')
  })
})

describe('validateHourlyStart', () => {
  it('accepts a start after the notice period', () => {
    expect(validateHourlyStart('2026-10-01', '20:00', { minNoticeHours: 12, now: NOW })).toBeNull()
  })

  it('rejects a start inside the notice period', () => {
    expect(validateHourlyStart('2026-10-01', '19:59', { minNoticeHours: 12, now: NOW }))
      .toBe('Hourly hire needs at least 12 hours notice.')
  })

  it('with no notice, only rejects the past', () => {
    expect(validateHourlyStart('2026-10-01', '07:00', { minNoticeHours: 0, now: NOW }))
      .toBe('The start time has already passed.')
    expect(validateHourlyStart('2026-10-01', '09:00', { minNoticeHours: 0, now: NOW })).toBeNull()
  })
})

describe('validatePickupStart', () => {
  it('accepts a pickup later today in the operating timezone', () => {
    expect(validatePickupStart('2026-10-01', '08:01', { now: NOW })).toBeNull()
  })

  it('refuses a pickup that has already passed today, or at this minute', () => {
    expect(validatePickupStart('2026-10-01', '07:00', { now: NOW })).toBe('The pickup time has already passed. Choose a later time.')
    expect(validatePickupStart('2026-10-01', '08:00', { now: NOW })).toBe('The pickup time has already passed. Choose a later time.')
  })

  it('refuses a malformed date or time', () => {
    expect(validatePickupStart('2026-10-01', '', { now: NOW })).toBe('Choose a valid pickup date and time.')
  })
})
