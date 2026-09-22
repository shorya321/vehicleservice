import { firstPickupHasPassed } from '@/lib/trips/pickup-passed'

const NOW = new Date('2026-09-22T11:00:00Z')

describe('firstPickupHasPassed', () => {
  it('is false while every pickup is still ahead', () => {
    expect(firstPickupHasPassed(['2026-09-22T11:01:00Z', '2026-09-25T08:00:00Z'], NOW)).toBe(false)
  })

  it('is true once the earliest pickup has come, whatever the order given', () => {
    expect(firstPickupHasPassed(['2026-09-25T08:00:00Z', '2026-09-22T11:00:00Z'], NOW)).toBe(true)
    expect(firstPickupHasPassed(['2026-09-21T08:00:00Z'], NOW)).toBe(true)
  })

  it('ignores missing or unreadable values, and is false with none left', () => {
    expect(firstPickupHasPassed([null, 'not a date'], NOW)).toBe(false)
    expect(firstPickupHasPassed([], NOW)).toBe(false)
  })
})
