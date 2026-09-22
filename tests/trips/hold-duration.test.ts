import { assertHoldCoversBooking, defaultHoldHours, minimumHoldHours } from '@/lib/vendor/bookings/duration'

describe('hourly hire hold floor', () => {
  it('keeps the transfer minimum when nothing was booked by the hour', () => {
    expect(minimumHoldHours(null)).toBe(1)
    expect(defaultHoldHours(undefined)).toBe(3)
    expect(() => assertHoldCoversBooking(1, null)).not.toThrow()
  })

  it('holds at least the paid hours, rounding a half hour up', () => {
    expect(minimumHoldHours(5)).toBe(5)
    expect(minimumHoldHours(4.5)).toBe(5)
    expect(defaultHoldHours(10)).toBe(10)
    expect(defaultHoldHours(2)).toBe(3)
  })

  it('refuses a hold shorter than the hire', () => {
    expect(() => assertHoldCoversBooking(4, 5)).toThrow('at least 5 hours')
    expect(() => assertHoldCoversBooking(5, 5)).not.toThrow()
  })

  it('never asks for more than the 24 hour maximum', () => {
    expect(minimumHoldHours(30)).toBe(24)
  })
})
