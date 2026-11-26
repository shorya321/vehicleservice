import { adjustToFloor, customerLeadMinutes, customerPickupFloor, formatLead } from '@/lib/trips/lead-time'
import { setBookingTimezone } from '@/lib/utils/timezone'

beforeAll(() => setBookingTimezone('Asia/Dubai'))
afterAll(() => setBookingTimezone(null))

describe('customerLeadMinutes', () => {
  const settings = { minLeadHours: 2, hourlyMinNoticeHours: 12 }

  it('uses the lead for one way, round trip and multi-city', () => {
    expect(customerLeadMinutes('one_way', settings)).toBe(120)
    expect(customerLeadMinutes('round_trip', settings)).toBe(120)
    expect(customerLeadMinutes('multi_city', settings)).toBe(120)
  })

  it('gives hourly the longer of its notice and the lead', () => {
    expect(customerLeadMinutes('hourly', settings)).toBe(720)
    expect(customerLeadMinutes('hourly', { minLeadHours: 24, hourlyMinNoticeHours: 12 })).toBe(1440)
  })

  it('is 0 when both are 0', () => {
    expect(customerLeadMinutes('one_way', { minLeadHours: 0, hourlyMinNoticeHours: 0 })).toBe(0)
  })
})

describe('customerPickupFloor', () => {
  it('adds the lead in Dubai time and rounds up to the next 5 minute slot', () => {
    // 08:02:30 Dubai
    expect(customerPickupFloor(new Date('2026-10-01T04:02:30Z'), 120)).toEqual({ date: '2026-10-01', time: '10:05' })
  })

  it('keeps an exact slot as it is', () => {
    expect(customerPickupFloor(new Date('2026-10-01T04:00:00Z'), 120)).toEqual({ date: '2026-10-01', time: '10:00' })
  })

  it('rolls the date past Dubai midnight even when UTC is still the previous day', () => {
    // 23:10 Dubai on 1 Oct is 19:10 UTC on 1 Oct
    expect(customerPickupFloor(new Date('2026-10-01T19:10:00Z'), 120)).toEqual({ date: '2026-10-02', time: '01:10' })
  })
})

describe('adjustToFloor', () => {
  const floor = { date: '2026-10-01', time: '10:05' }

  it('moves a too-soon or empty time on the floor day up to the floor', () => {
    expect(adjustToFloor('2026-10-01', '09:00', floor)).toEqual(floor)
    expect(adjustToFloor('2026-10-01', '', floor)).toEqual(floor)
  })

  it('keeps a later time, and any time on a later day', () => {
    expect(adjustToFloor('2026-10-01', '14:00', floor)).toEqual({ date: '2026-10-01', time: '14:00' })
    expect(adjustToFloor('2026-10-02', '06:00', floor)).toEqual({ date: '2026-10-02', time: '06:00' })
  })

  it('fills noon on a later day with no time', () => {
    expect(adjustToFloor('2026-10-02', '', floor)).toEqual({ date: '2026-10-02', time: '12:00' })
  })
})

describe('formatLead', () => {
  it('reads as hours or minutes', () => {
    expect(formatLead(60)).toBe('1 hour')
    expect(formatLead(120)).toBe('2 hours')
    expect(formatLead(90)).toBe('90 minutes')
  })
})
