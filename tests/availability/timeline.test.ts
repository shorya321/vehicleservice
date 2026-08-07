import {
  FLEET_SPANS,
  barMinWidthPx,
  buildTimelineLanes,
  timelineTicks,
  timelineTrackWidth,
  timelineWindow,
  type FleetSpan,
  type TimelineResource,
} from '@/lib/availability/timeline'
import type { CalendarEvent } from '@/app/vendor/availability/types'

/**
 * The fleet timeline's layout maths. Pure arithmetic over events and a window, so
 * it is tested directly rather than through the DOM.
 *
 * All times are Asia/Dubai wall-clock (UTC+04:00, no DST), matching how the rest of
 * the product stores and reasons about booking times.
 */

const VEHICLE: TimelineResource = { id: 'veh-1', label: 'Camry' }
const OTHER_VEHICLE: TimelineResource = { id: 'veh-2', label: 'Hiace' }
const DRIVER: TimelineResource = { id: 'drv-1', label: 'Rahul' }

/** 2026-02-12 in Dubai: midnight is 2026-02-11T20:00Z. */
const DAY = new Date('2026-02-12T04:00:00+04:00')

function dubai(time: string): Date {
  return new Date(`2026-02-12T${time}:00+04:00`)
}

function booking(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'evt-1',
    title: 'Trip #1',
    start: dubai('09:00'),
    end: dubai('12:00'),
    resourceId: 'evt-1',
    resourceType: 'booking',
    type: 'booking',
    vehicleId: VEHICLE.id,
    driverId: DRIVER.id,
    source: 'online',
    occupies: true,
    ...overrides,
  }
}

function layoutFor(events: CalendarEvent[]) {
  const { start, end } = timelineWindow(DAY, 'day')
  return buildTimelineLanes({
    events,
    vehicles: [VEHICLE, OTHER_VEHICLE],
    drivers: [DRIVER],
    windowStart: start,
    windowEnd: end,
    trackWidth: timelineTrackWidth('day'),
  })
}

describe('timelineWindow', () => {
  it('anchors a day to Dubai midnight, not the server timezone', () => {
    const { start, end } = timelineWindow(DAY, 'day')

    expect(start.toISOString()).toBe('2026-02-11T20:00:00.000Z')
    expect(end.toISOString()).toBe('2026-02-12T20:00:00.000Z')
  })

  it('starts a week on Monday', () => {
    // 2026-02-12 is a Thursday, so the week starts on Monday the 9th.
    const { start, end } = timelineWindow(DAY, 'week')

    expect(start.toISOString()).toBe('2026-02-08T20:00:00.000Z')
    expect(end.toISOString()).toBe('2026-02-15T20:00:00.000Z')
  })
})

describe('buildTimelineLanes', () => {
  it('places one booking in BOTH its vehicle lane and its driver lane', () => {
    const layout = layoutFor([booking()])

    expect(layout.vehicleLanes[0].bars).toHaveLength(1)
    expect(layout.driverLanes[0].bars).toHaveLength(1)
    // ...and leaves the untouched vehicle free.
    expect(layout.vehicleLanes[1].bars).toHaveLength(0)
  })

  it('positions a bar as a percentage of the Dubai day', () => {
    const [bar] = layoutFor([booking()]).vehicleLanes[0].bars

    // 09:00 of 24h = 37.5%, three hours wide = 12.5%.
    expect(bar.leftPct).toBeCloseTo(37.5)
    expect(bar.widthPct).toBeCloseTo(12.5)
    expect(bar.clippedStart).toBe(false)
    expect(bar.clippedEnd).toBe(false)
  })

  it('clamps an event that overruns the window and flags both edges', () => {
    const [bar] = layoutFor([
      booking({
        start: new Date('2026-02-11T18:00:00+04:00'),
        end: new Date('2026-02-13T06:00:00+04:00'),
      }),
    ]).vehicleLanes[0].bars

    expect(bar.leftPct).toBe(0)
    expect(bar.widthPct).toBe(100)
    expect(bar.clippedStart).toBe(true)
    expect(bar.clippedEnd).toBe(true)
  })

  it('stacks overlapping trips into separate sub-rows', () => {
    const layout = layoutFor([
      booking({ id: 'a', start: dubai('09:00'), end: dubai('12:00') }),
      booking({ id: 'b', start: dubai('10:00'), end: dubai('14:00') }),
    ])

    const lane = layout.vehicleLanes[0]
    expect(lane.bars.map((b) => b.row)).toEqual([0, 1])
    expect(lane.rowCount).toBe(2)
  })

  it('reuses a sub-row for back-to-back trips', () => {
    const layout = layoutFor([
      booking({ id: 'a', start: dubai('09:00'), end: dubai('12:00') }),
      booking({ id: 'b', start: dubai('12:00'), end: dubai('15:00') }),
    ])

    const lane = layout.vehicleLanes[0]
    expect(lane.bars.map((b) => b.row)).toEqual([0, 0])
    expect(lane.rowCount).toBe(1)
  })

  it('drops events outside the window, treating the boundary as half-open', () => {
    const layout = layoutFor([
      // Ends exactly at Dubai midnight: belongs to the previous day.
      booking({ id: 'before', start: dubai('00:00'), end: dubai('00:00') }),
      booking({
        id: 'after',
        start: new Date('2026-02-13T01:00:00+04:00'),
        end: new Date('2026-02-13T03:00:00+04:00'),
      }),
    ])

    expect(layout.vehicleLanes[0].bars).toHaveLength(0)
  })

  it('routes a pending offer to its own row, never to a resource lane', () => {
    // A pending assignment has named neither a vehicle nor a driver: those columns
    // are NULL until the vendor accepts.
    const layout = layoutFor([
      booking({ id: 'offer', vehicleId: null, driverId: null, occupies: false, status: 'pending' }),
    ])

    expect(layout.pendingBars).toHaveLength(1)
    expect(layout.vehicleLanes[0].bars).toHaveLength(0)
    expect(layout.driverLanes[0].bars).toHaveLength(0)
  })

  it('puts an unavailability block on the single resource it names', () => {
    const layout = layoutFor([
      booking({
        id: 'block',
        type: 'unavailable',
        resourceType: 'vehicle',
        resourceId: VEHICLE.id,
        vehicleId: null,
        driverId: null,
        source: 'blocked',
      }),
    ])

    expect(layout.vehicleLanes[0].bars).toHaveLength(1)
    // A vehicle block must not also consume the driver.
    expect(layout.driverLanes[0].bars).toHaveLength(0)
  })

  it('keeps a very short trip clickable rather than zero-width', () => {
    const [bar] = layoutFor([
      booking({ start: dubai('09:00'), end: dubai('09:05') }),
    ]).vehicleLanes[0].bars

    expect(bar.widthPct).toBeGreaterThan(0)
    expect(bar.leftPct + bar.widthPct).toBeLessThanOrEqual(100)
  })

  it('never lets a widened sliver at the right edge overflow the lane', () => {
    const [bar] = layoutFor([
      booking({ start: dubai('23:59'), end: new Date('2026-02-13T00:00:00+04:00') }),
    ]).vehicleLanes[0].bars

    expect(bar.leftPct + bar.widthPct).toBeLessThanOrEqual(100)
  })

  it('reports an empty lane as one row so it still renders', () => {
    const layout = layoutFor([])

    expect(layout.vehicleLanes[0].rowCount).toBe(1)
    expect(layout.vehicleLanes[0].bars).toHaveLength(0)
  })
})

describe('the 3-day span', () => {
  it('runs forward from the day on screen, not backwards into a block', () => {
    const { start, end } = timelineWindow(DAY, '3day')

    expect(start.toISOString()).toBe('2026-02-11T20:00:00.000Z')
    expect(end.getTime() - start.getTime()).toBe(3 * 24 * 60 * 60 * 1000)
  })

  it('draws three days at a wider scale than a week', () => {
    expect(timelineTrackWidth('3day')).toBe(3 * 24 * FLEET_SPANS['3day'].pxPerHour)
    expect(timelineTrackWidth('3day') / 3).toBeGreaterThan(timelineTrackWidth('week') / 7)
  })
})

describe('timelineTicks', () => {
  it('gives the header and the lane guides one shared set of positions', () => {
    // These used to disagree: seven day labels above twelve evenly spaced guides,
    // so on a week every guide line sat 14 hours from the label over it.
    for (const span of ['day', '3day', 'week'] as const) {
      const ticks = timelineTicks(timelineWindow(DAY, span).start, span)

      expect(ticks.length).toBeGreaterThan(0)
      expect(ticks[0].leftPct).toBe(0)
      expect(ticks[ticks.length - 1].leftPct).toBeLessThan(100)
      expect(ticks.every((tick) => tick.leftPct >= 0 && tick.leftPct < 100)).toBe(true)
    }
  })

  it('marks midnight as a major tick and dates it on multi-day spans', () => {
    const week = timelineTicks(timelineWindow(DAY, 'week').start, 'week')
    const majors = week.filter((tick) => tick.major)

    expect(majors).toHaveLength(7)
    expect(majors[0].label).toMatch(/^Mon \d+$/)
    expect(week.find((tick) => !tick.major)?.label).toMatch(/^\d{2}:\d{2}$/)
  })

  it('labels a single day in hours only', () => {
    const day = timelineTicks(timelineWindow(DAY, 'day').start, 'day')

    expect(day[0].label).toBe('00:00')
    expect(day.every((tick) => /^\d{2}:\d{2}$/.test(tick.label))).toBe(true)
  })
})

describe('the awaiting-response row', () => {
  it('takes pending offers, which name no resource', () => {
    const layout = layoutFor([
      booking({ id: 'offer', status: 'pending', occupies: false, vehicleId: null, driverId: null }),
    ])

    expect(layout.pendingBars).toHaveLength(1)
  })

  it('leaves out an assignment the vendor already rejected', () => {
    // A rejected assignment also names no vehicle and no driver. Without the
    // status check it landed under "Awaiting your response", which read as work
    // still owed an answer.
    const layout = layoutFor([
      booking({ id: 'rejected', status: 'rejected', occupies: false, vehicleId: null, driverId: null }),
    ])

    expect(layout.pendingBars).toHaveLength(0)
  })
})

describe('sub-row packing across spans', () => {
  it('keeps back-to-back trips on one row at every zoom level', () => {
    // Row assignment used to compare percentage widths, which are the result of a
    // division: on a 3-day span these two came out as 18.055555555555557 against
    // 18.055555555555554 and the second was stacked as though double booked.
    for (const span of ['day', '3day', 'week'] as const) {
      const { start, end } = timelineWindow(DAY, span)
      const layout = buildTimelineLanes({
        events: [
          booking({ id: 'first', start: dubai('09:00'), end: dubai('13:00') }),
          booking({ id: 'second', start: dubai('13:00'), end: dubai('16:30') }),
        ],
        vehicles: [VEHICLE],
        drivers: [DRIVER],
        windowStart: start,
        windowEnd: end,
        trackWidth: timelineTrackWidth(span),
      })

      expect(layout.vehicleLanes[0].bars.map((bar) => bar.row)).toEqual([0, 0])
      expect(layout.vehicleLanes[0].rowCount).toBe(1)
    }
  })

  it('still stacks a genuine overlap at every zoom level', () => {
    for (const span of ['day', '3day', 'week'] as const) {
      const { start, end } = timelineWindow(DAY, span)
      const layout = buildTimelineLanes({
        events: [
          booking({ id: 'first', start: dubai('09:00'), end: dubai('13:00') }),
          booking({ id: 'second', start: dubai('12:00'), end: dubai('16:30') }),
        ],
        vehicles: [VEHICLE],
        drivers: [DRIVER],
        windowStart: start,
        windowEnd: end,
        trackWidth: timelineTrackWidth(span),
      })

      expect(layout.vehicleLanes[0].bars.map((bar) => bar.row)).toEqual([0, 1])
    }
  })
})

describe('bars are drawn wide enough for their own label', () => {
  const dayWidth = timelineTrackWidth('day')

  const layoutAt = (events: CalendarEvent[], span: FleetSpan = 'day') => {
    const { start, end } = timelineWindow(DAY, span)
    return buildTimelineLanes({
      events,
      vehicles: [VEHICLE],
      drivers: [DRIVER],
      windowStart: start,
      windowEnd: end,
      trackWidth: timelineTrackWidth(span),
    })
  }

  it('widens a five-minute job to fit its text instead of drawing a bare sliver', () => {
    // This is the defect the vendor reported: ZZ-TINY drew as ~2px of colour with
    // no label on it at all.
    const [bar] = layoutAt([
      booking({ id: 'tiny', title: 'Tiny Trip', start: dubai('09:00'), end: dubai('09:05') }),
    ]).vehicleLanes[0].bars

    // Five minutes is 5px at the day zoom: nowhere near enough for a label.
    expect(bar.naturalWidthPx).toBeLessThan(barMinWidthPx('Tiny Trip'))
    expect(bar.widthPx).toBeGreaterThanOrEqual(barMinWidthPx('Tiny Trip'))
  })

  it('leaves a long job at its natural width: widening never shrinks a bar', () => {
    const [bar] = layoutAt([
      booking({ id: 'long', title: 'Trip #1', start: dubai('06:00'), end: dubai('18:00') }),
    ]).vehicleLanes[0].bars

    expect(bar.widthPx).toBeCloseTo(bar.naturalWidthPx, 5)
    expect(bar.widthPx).toBeCloseTo(dayWidth / 2, 5)
  })

  it('keeps leftPct and widthPct as the TRUE proportions after widening', () => {
    // The drawn box is a rendering concern. Anything reasoning about when the job
    // actually runs still has the honest numbers.
    const [bar] = layoutAt([
      booking({ id: 'tiny', title: 'Tiny Trip', start: dubai('12:00'), end: dubai('12:05') }),
    ]).vehicleLanes[0].bars

    expect(bar.leftPct).toBeCloseTo(50, 5)
    expect(bar.widthPct).toBeCloseTo((5 / (24 * 60)) * 100, 5)
  })

  it('stacks two jobs that only collide once they are widened', () => {
    // Ten minutes apart in time, so nothing overlaps; widened to fit their labels
    // they would sit on top of each other, and the second would be invisible.
    const layout = layoutAt([
      booking({ id: 'a', title: 'Overlap A', start: dubai('09:00'), end: dubai('09:05') }),
      booking({ id: 'b', title: 'Back To Back', start: dubai('09:10'), end: dubai('09:15') }),
    ])

    expect(layout.vehicleLanes[0].bars.map((bar) => bar.row)).toEqual([0, 1])
    expect(layout.vehicleLanes[0].rowCount).toBe(2)
  })

  it('still shares a row when the drawn boxes clear each other', () => {
    const layout = layoutAt([
      booking({ id: 'a', title: 'Overlap A', start: dubai('09:00'), end: dubai('13:00') }),
      booking({ id: 'b', title: 'Back To Back', start: dubai('13:00'), end: dubai('16:30') }),
    ])

    expect(layout.vehicleLanes[0].bars.map((bar) => bar.row)).toEqual([0, 0])
  })

  it('shifts a widened bar at the right edge back rather than overflowing the lane', () => {
    const [bar] = layoutAt([
      booking({ id: 'late', title: 'Late Night Run', start: dubai('23:55'), end: new Date('2026-02-13T00:00:00+04:00') }),
    ]).vehicleLanes[0].bars

    expect(bar.leftPx + bar.widthPx).toBeLessThanOrEqual(dayWidth)
    expect(bar.leftPx).toBeGreaterThanOrEqual(0)
  })

  it('never draws a bar wider than the whole track, at any zoom', () => {
    for (const span of ['day', '3day', 'week'] as const) {
      const trackWidth = timelineTrackWidth(span)
      const [bar] = layoutAt(
        [booking({ id: 'tiny', title: 'A very long customer name indeed', start: dubai('09:00'), end: dubai('09:01') })],
        span
      ).vehicleLanes[0].bars

      expect(bar.widthPx).toBeLessThanOrEqual(trackWidth)
      expect(bar.leftPx + bar.widthPx).toBeLessThanOrEqual(trackWidth + 0.001)
    }
  })
})

describe('barMinWidthPx', () => {
  it('grows with the label', () => {
    expect(barMinWidthPx('Maintenance')).toBeGreaterThan(barMinWidthPx('Leave'))
  })

  it('caps, so one enormous customer name cannot swallow the lane', () => {
    expect(barMinWidthPx('x'.repeat(500))).toBe(barMinWidthPx('y'.repeat(400)))
  })
})
