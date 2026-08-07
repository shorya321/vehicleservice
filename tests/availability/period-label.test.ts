import { isWholeDayPeriod, unavailabilityPeriodLabel } from '@/lib/availability/period-label'

/**
 * How a blocked period is described.
 *
 * The stored range is half-open, so blocking one day ends at the next midnight.
 * Printing that end literally told the vendor the following day was blocked as
 * well. These tests pin the sentence, not the stored value, which does not
 * change.
 */

const dubai = (iso: string) => new Date(`${iso}+04:00`)

describe('isWholeDayPeriod', () => {
  it('recognises a single day picked from the month grid', () => {
    expect(isWholeDayPeriod(dubai('2026-09-05T00:00:00'), dubai('2026-09-06T00:00:00'))).toBe(true)
  })

  it('recognises several whole days', () => {
    expect(isWholeDayPeriod(dubai('2026-09-05T00:00:00'), dubai('2026-09-08T00:00:00'))).toBe(true)
  })

  it('rejects a part-day range from the week grid', () => {
    expect(isWholeDayPeriod(dubai('2026-09-05T08:00:00'), dubai('2026-09-05T10:30:00'))).toBe(false)
  })

  it('rejects an empty or inverted range', () => {
    expect(isWholeDayPeriod(dubai('2026-09-05T00:00:00'), dubai('2026-09-05T00:00:00'))).toBe(false)
    expect(isWholeDayPeriod(dubai('2026-09-06T00:00:00'), dubai('2026-09-05T00:00:00'))).toBe(false)
  })

  it('judges midnight in Dubai, not wherever the browser is', () => {
    // 20:00 UTC is midnight in Dubai. A browser-local check would call this a
    // part-day range and print the raw timestamps.
    expect(isWholeDayPeriod(new Date('2026-09-04T20:00:00Z'), new Date('2026-09-05T20:00:00Z'))).toBe(true)
  })
})

describe('unavailabilityPeriodLabel', () => {
  it('names one day without ever mentioning the next one', () => {
    // The defect: this used to read "Sep 05, 2026 00:00 - Sep 06, 2026 00:00",
    // so a vendor blocking the 5th believed the 6th was gone too.
    const label = unavailabilityPeriodLabel(
      dubai('2026-09-05T00:00:00'),
      dubai('2026-09-06T00:00:00')
    )

    expect(label).toBe('All day on Sep 05, 2026')
    expect(label).not.toContain('06')
  })

  it('names the last day actually covered, not the exclusive end', () => {
    const label = unavailabilityPeriodLabel(
      dubai('2026-09-05T00:00:00'),
      dubai('2026-09-08T00:00:00')
    )

    expect(label).toBe('Sep 05 to Sep 07, 2026, all day')
    expect(label).not.toContain('08')
  })

  it('keeps the times on a part-day block', () => {
    expect(
      unavailabilityPeriodLabel(dubai('2026-09-05T08:00:00'), dubai('2026-09-05T10:30:00'))
    ).toBe('Sep 05, 2026 08:00 to 10:30')
  })

  it('spells out both dates when a part-day block crosses midnight', () => {
    expect(
      unavailabilityPeriodLabel(dubai('2026-09-05T22:00:00'), dubai('2026-09-06T02:00:00'))
    ).toBe('Sep 05, 2026 22:00 to Sep 06, 2026 02:00')
  })

  it('renders in Dubai time regardless of the stored instant', () => {
    // 2026-09-04T20:00Z is 2026-09-05 00:00 in Dubai.
    expect(
      unavailabilityPeriodLabel(new Date('2026-09-04T20:00:00Z'), new Date('2026-09-05T20:00:00Z'))
    ).toBe('All day on Sep 05, 2026')
  })
})
