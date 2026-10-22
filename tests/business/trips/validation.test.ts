import {
  businessLegStart,
  nextLegEarliestStart,
  validateBusinessHourlyStart,
  validateBusinessLegTiming,
  validateBusinessPickupLead,
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

  it('holds every pickup to the minimum lead time', () => {
    const lead = { ...opts, minLeadMinutes: 120 }
    // NOW is 10:00 Dubai, so 12:00 is exactly two hours away.
    expect(validateBusinessLegTiming([leg('a', 'b', '2030-01-10', '12:00', 30), leg('b', 'a', '2030-01-10', '14:00')], lead)).toBeNull()
    expect(
      validateBusinessLegTiming([leg('a', 'b', '2030-01-10', '11:55', 30), leg('b', 'a', '2030-01-10', '14:00')], { ...lead, roundTrip: true })
    ).toBe('Outbound: pickup must be at least 2 hours from now.')
    // The past still reads as past, not as too soon.
    expect(validateBusinessLegTiming([leg('a', 'b', '2030-01-10', '09:00'), leg('b', 'a', '2030-01-10', '14:00')], lead)).toMatch(/already passed/)
  })

  it('reports order alone when the real drive times are not known', () => {
    const order = { ...opts, bufferMinutes: 0, orderOnly: true }
    expect(
      validateBusinessLegTiming([leg('a', 'b', '2030-01-11', '10:00', 1), leg('b', 'a', '2030-01-11', '08:00', 1)], { ...order, roundTrip: true })
    ).toBe('The return must start after the outbound journey.')
    expect(
      validateBusinessLegTiming([leg('a', 'b', '2030-01-11', '10:00', 1), leg('b', 'c', '2030-01-11', '10:00', 1)], order)
    ).toBe('Journey 2 must start after journey 1.')
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

describe('validateBusinessPickupLead', () => {
  it('accepts a pickup exactly the lead time away and refuses one a minute sooner', () => {
    expect(validateBusinessPickupLead('2030-01-10T08:00:00Z', 120, NOW)).toBeNull()
    expect(validateBusinessPickupLead('2030-01-10T07:59:00Z', 120, NOW)).toBe('Pickup must be at least 2 hours from now.')
  })

  it('reports a past pickup as passed, whatever the lead', () => {
    expect(validateBusinessPickupLead('2030-01-10T05:00:00Z', 120, NOW)).toBe('The pickup time has already passed.')
    expect(validateBusinessPickupLead('2030-01-10T05:00:00Z', 0, NOW)).toBe('The pickup time has already passed.')
    expect(validateBusinessPickupLead('2030-01-10T06:01:00Z', 0, NOW)).toBeNull()
  })

  it('refuses an unreadable instant', () => {
    expect(validateBusinessPickupLead('nope', 120, NOW)).toBe('Choose a valid pickup date and time.')
  })
})
