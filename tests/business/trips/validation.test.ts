import {
  businessLegStart,
  nextLegEarliestStart,
  validateBusinessHourlyStart,
  validateBusinessLegTiming,
  validateRoundTripRoute,
} from '@/lib/business/trips/validation'

const NOW = new Date('2030-01-10T06:00:00Z') // 10:00 in Dubai
const leg = (fromId: string, toId: string, date: string, time: string, durationMinutes?: number) => ({
  fromId,
  toId,
  date,
  time,
  durationMinutes,
})
const opts = { bufferMinutes: 60, maxLegs: 4, now: NOW }

describe('validateBusinessLegTiming', () => {
  it('accepts journeys in order with room for the drive and buffer', () => {
    expect(
      validateBusinessLegTiming([leg('a', 'b', '2030-01-11', '10:00', 30), leg('b', 'a', '2030-01-11', '11:30')], opts)
    ).toBeNull()
  })

  it('refuses a journey that starts before the previous one has arrived plus buffer', () => {
    const error = validateBusinessLegTiming(
      [leg('a', 'b', '2030-01-11', '10:00', 30), leg('b', 'a', '2030-01-11', '11:00')],
      { ...opts, roundTrip: true }
    )
    expect(error).toMatch(/return starts too soon/i)
  })

  it('falls back to 60 minutes when a route has no recorded duration', () => {
    expect(
      validateBusinessLegTiming([leg('a', 'b', '2030-01-11', '10:00'), leg('b', 'c', '2030-01-11', '11:59')], opts)
    ).toMatch(/Journey 2 starts too soon/)
  })

  it('refuses past pickups, same-place journeys, too many journeys and missing locations', () => {
    expect(validateBusinessLegTiming([leg('a', 'b', '2030-01-09', '10:00'), leg('b', 'a', '2030-01-11', '10:00')], opts)).toMatch(/already passed/)
    expect(validateBusinessLegTiming([leg('a', 'a', '2030-01-11', '10:00'), leg('a', 'b', '2030-01-11', '15:00')], opts)).toMatch(/must differ/)
    expect(validateBusinessLegTiming([leg('', 'b', '2030-01-11', '10:00'), leg('b', 'a', '2030-01-11', '15:00')], opts)).toMatch(/choose both/)
    const five = ['10:00', '13:00', '16:00', '19:00', '22:00'].map((t, i) => leg(`l${i}`, `l${i + 1}`, '2030-01-11', t))
    expect(validateBusinessLegTiming(five, opts)).toMatch(/at most 4 journeys/)
    expect(validateBusinessLegTiming([leg('a', 'b', '2030-01-11', '10:00')], opts)).toMatch(/at least two/)
  })

  it('refuses malformed dates and times', () => {
    expect(validateBusinessLegTiming([leg('a', 'b', '2030-1-11', '10:00'), leg('b', 'a', '2030-01-11', '15:00')], opts)).toMatch(/valid date/)
    expect(validateBusinessLegTiming([leg('a', 'b', '2030-01-11', '25:00'), leg('b', 'a', '2030-01-11', '15:00')], opts)).toMatch(/valid date/)
  })
})

describe('validateRoundTripRoute', () => {
  it('requires the return to reverse the outbound', () => {
    expect(validateRoundTripRoute([{ fromId: 'a', toId: 'b' }, { fromId: 'b', toId: 'a' }])).toBeNull()
    expect(validateRoundTripRoute([{ fromId: 'a', toId: 'b' }, { fromId: 'b', toId: 'c' }])).toMatch(/back the way/)
    expect(validateRoundTripRoute([{ fromId: 'a', toId: 'b' }])).toMatch(/exactly two/)
  })
})

describe('validateBusinessHourlyStart', () => {
  it('enforces the notice period', () => {
    expect(validateBusinessHourlyStart('2030-01-10', '21:00', { minNoticeHours: 12, now: NOW })).toMatch(/12 hours notice/)
    expect(validateBusinessHourlyStart('2030-01-10', '22:00', { minNoticeHours: 12, now: NOW })).toBeNull()
  })

  it('reports a past start when no notice is required', () => {
    expect(validateBusinessHourlyStart('2030-01-10', '09:00', { minNoticeHours: 0, now: NOW })).toMatch(/already passed/)
  })
})

describe('businessLegStart / nextLegEarliestStart', () => {
  it('reads wall-clock time in the operating timezone', () => {
    expect(businessLegStart({ date: '2030-01-11', time: '10:00' })?.toISOString()).toBe('2030-01-11T06:00:00.000Z')
    expect(businessLegStart({ date: 'bad', time: '10:00' })).toBeNull()
  })

  it('adds drive time and buffer', () => {
    const start = new Date('2030-01-11T06:00:00Z')
    expect(nextLegEarliestStart(start, 45, 15).toISOString()).toBe('2030-01-11T07:00:00.000Z')
    expect(nextLegEarliestStart(start, null, 0).toISOString()).toBe('2030-01-11T07:00:00.000Z')
  })
})
