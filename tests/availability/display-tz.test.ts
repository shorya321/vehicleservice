import { fromDisplayDate, toDisplayDate } from '@/lib/availability/display-tz'

/**
 * The shim that makes react-big-calendar draw Dubai wall-clock.
 *
 * RBC positions an event by reading `Date.getHours()`, which answers in the
 * browser's timezone. A vendor in India therefore read one booking as 10:30 in
 * the week grid and 09:00 in the Fleet bar and the details dialog. These tests
 * pin the conversion in both directions, because the outbound half feeds the
 * grid and the inbound half decides what a drag actually writes to the database.
 */

/** The offset the test process runs in, so the expectations hold on any machine. */
const localOffsetMinutes = (instant: Date) => -instant.getTimezoneOffset()
const DUBAI_OFFSET_MINUTES = 4 * 60

describe('toDisplayDate', () => {
  it('makes the browser read a stored instant as Dubai wall-clock', () => {
    // 09:00 Dubai on 10 Aug 2026, the exact booking that exposed the split.
    const instant = new Date('2026-08-10T09:00:00+04:00')
    const displayed = toDisplayDate(instant)

    expect(displayed.getHours()).toBe(9)
    expect(displayed.getMinutes()).toBe(0)
    expect(displayed.getDate()).toBe(10)
  })

  it('shifts by exactly the difference between Dubai and the local offset', () => {
    const instant = new Date('2026-08-10T09:00:00+04:00')
    const expectedShift = (DUBAI_OFFSET_MINUTES - localOffsetMinutes(instant)) * 60_000

    expect(toDisplayDate(instant).getTime() - instant.getTime()).toBe(expectedShift)
  })

  it('keeps a trip that crosses Dubai midnight on the right side of it', () => {
    const start = toDisplayDate(new Date('2026-08-11T22:00:00+04:00'))
    const end = toDisplayDate(new Date('2026-08-12T02:00:00+04:00'))

    expect(start.getDate()).toBe(11)
    expect(start.getHours()).toBe(22)
    expect(end.getDate()).toBe(12)
    expect(end.getHours()).toBe(2)
  })
})

describe('fromDisplayDate', () => {
  it('round-trips every instant it is given', () => {
    const instants = [
      new Date('2026-01-01T00:00:00+04:00'),
      new Date('2026-03-29T02:30:00+04:00'), // inside the European DST switch
      new Date('2026-08-10T09:00:00+04:00'),
      new Date('2026-11-01T01:15:00+04:00'), // inside the US DST switch
      new Date('2026-12-31T23:59:00+04:00'),
    ]

    for (const instant of instants) {
      expect(fromDisplayDate(toDisplayDate(instant)).getTime()).toBe(instant.getTime())
    }
  })

  it('turns a slot drag back into the Dubai day the vendor selected', () => {
    // What RBC reports for a whole-day month-grid drag: local midnight to local
    // midnight, against dates that are already shifted.
    const displayedStart = toDisplayDate(new Date('2026-08-13T00:00:00+04:00'))
    const displayedEnd = toDisplayDate(new Date('2026-08-14T00:00:00+04:00'))

    expect(fromDisplayDate(displayedStart).toISOString()).toBe('2026-08-12T20:00:00.000Z')
    expect(fromDisplayDate(displayedEnd).toISOString()).toBe('2026-08-13T20:00:00.000Z')
  })
})
