import {
  adjustToFloor,
  effectiveLeadMinutes,
  pickupFloor,
} from '@/lib/business/trips/pickup-floor'
import { DEFAULT_BUSINESS_TRIP_SETTINGS } from '@/lib/business/trips/settings'

const NOW = new Date('2030-01-10T06:21:00Z') // 10:21 in Dubai

describe('pickupFloor', () => {
  it('adds the lead and rounds up to the next 5-minute slot, in Dubai wall-clock', () => {
    expect(pickupFloor(NOW, 120)).toEqual({ date: '2030-01-10', time: '12:25' })
  })

  it('keeps an exact slot as it is', () => {
    expect(pickupFloor(new Date('2030-01-10T06:20:00Z'), 120)).toEqual({ date: '2030-01-10', time: '12:20' })
  })

  it('rounds from the exact instant, so 10:20:30 never offers a 12:20 the server would refuse', () => {
    expect(pickupFloor(new Date('2030-01-10T06:20:30Z'), 120)).toEqual({ date: '2030-01-10', time: '12:25' })
  })

  it('rolls into the next Dubai day', () => {
    // 23:00 Dubai + 2h = 01:00 the next day.
    expect(pickupFloor(new Date('2030-01-10T19:00:00Z'), 120)).toEqual({ date: '2030-01-11', time: '01:00' })
  })

  it('rolls over when rounding crosses midnight', () => {
    // 21:58 Dubai + 2h = 23:58, rounded up to 00:00 the next day.
    expect(pickupFloor(new Date('2030-01-10T17:58:00Z'), 120)).toEqual({ date: '2030-01-11', time: '00:00' })
  })

  it('with no lead is the next slot after now', () => {
    expect(pickupFloor(NOW, 0)).toEqual({ date: '2030-01-10', time: '10:25' })
  })
})

describe('effectiveLeadMinutes', () => {
  const settings = { ...DEFAULT_BUSINESS_TRIP_SETTINGS, min_lead_hours: 2, hourly_min_notice_hours: 12 }

  it('uses the lead time for transfers', () => {
    expect(effectiveLeadMinutes('one_way', settings)).toBe(120)
    expect(effectiveLeadMinutes('round_trip', settings)).toBe(120)
    expect(effectiveLeadMinutes('multi_city', settings)).toBe(120)
  })

  it('uses the longer of the lead and the hourly notice for hourly hire', () => {
    expect(effectiveLeadMinutes('hourly', settings)).toBe(720)
    expect(effectiveLeadMinutes('hourly', { ...settings, hourly_min_notice_hours: 0 })).toBe(120)
  })
})

describe('adjustToFloor', () => {
  const floor = { date: '2030-01-10', time: '12:25' }

  it('fills an empty time with the floor on the floor day', () => {
    expect(adjustToFloor('2030-01-10', '', floor)).toEqual({ date: '2030-01-10', time: '12:25' })
  })

  it('fills an empty time with noon on a later day', () => {
    expect(adjustToFloor('2030-01-11', '', floor)).toEqual({ date: '2030-01-11', time: '12:00' })
  })

  it('bumps a time below the floor up to it', () => {
    expect(adjustToFloor('2030-01-10', '09:00', floor)).toEqual({ date: '2030-01-10', time: '12:25' })
  })

  it('keeps a time at or above the floor', () => {
    expect(adjustToFloor('2030-01-10', '12:25', floor)).toEqual({ date: '2030-01-10', time: '12:25' })
    expect(adjustToFloor('2030-01-10', '18:00', floor)).toEqual({ date: '2030-01-10', time: '18:00' })
  })

  it('keeps any time on a later day', () => {
    expect(adjustToFloor('2030-01-11', '06:00', floor)).toEqual({ date: '2030-01-11', time: '06:00' })
  })

  it('leaves the time alone when there is no floor yet', () => {
    expect(adjustToFloor('2030-01-10', '', null)).toEqual({ date: '2030-01-10', time: '12:00' })
    expect(adjustToFloor('2030-01-10', '09:00', null)).toEqual({ date: '2030-01-10', time: '09:00' })
  })

  it('leaves an empty date empty', () => {
    expect(adjustToFloor('', '09:00', floor)).toEqual({ date: '', time: '09:00' })
  })
})
