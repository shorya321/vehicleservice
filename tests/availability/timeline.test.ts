import {
  buildTimelineLanes,
  timelineWindow,
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
