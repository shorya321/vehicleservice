import { format } from 'date-fns'

import { bookingWallClockToUtc, toBookingTz } from '@/lib/utils/timezone'
import type { CalendarEvent } from '@/app/vendor/availability/types'

/**
 * Layout maths for the fleet timeline: one lane per vehicle and per driver, time
 * running left to right.
 *
 * Pure on purpose. Everything here is arithmetic over events and a window, with no
 * DOM and no React, so the clipping and overlap-stacking rules can be tested
 * directly. The component is then only markup.
 *
 * Why a custom grid rather than react-big-calendar's `resources`: RBC implements
 * resources as vertical COLUMNS and only in its TimeGrid views. Ten vehicles plus
 * ten drivers would be twenty narrow columns, available on the day view alone, and
 * it would require splitting every booking into one event per resource. That split
 * would leak into the month and week views, which work today. Lanes as rows scale
 * with fleet size, work for a day or a week, and consume the events already fetched.
 */

export interface TimelineResource {
  id: string
  label: string
  sublabel?: string
  /** Rendered as a persistent muted band: vehicle out of service, driver inactive. */
  outOfService?: string
}

export interface TimelineBar {
  event: CalendarEvent
  /** Percentage offsets within the window, already clamped to [0, 100]. */
  leftPct: number
  widthPct: number
  /** The event starts before / ends after the window, so the bar is cut off. */
  clippedStart: boolean
  clippedEnd: boolean
  /** Sub-row index, so overlapping bars stack instead of covering each other. */
  row: number
}

export interface TimelineLane {
  resource: TimelineResource
  kind: 'vehicle' | 'driver'
  bars: TimelineBar[]
  /** How many sub-rows this lane needs. At least 1, even when empty. */
  rowCount: number
}

export interface TimelineLayout {
  vehicleLanes: TimelineLane[]
  driverLanes: TimelineLane[]
  /**
   * Offers the vendor has not answered. They name no vehicle and no driver, so
   * they belong to no lane; they get their own row above the fleet.
   */
  pendingBars: TimelineBar[]
  pendingRowCount: number
}

/** Midnight in Asia/Dubai for whatever day the given instant falls on. */
export function startOfBookingDayFor(date: Date): Date {
  return bookingWallClockToUtc(format(toBookingTz(date.toISOString()), 'yyyy-MM-dd'), '00:00')
}

/** The [start, end) window a fleet view covers, anchored to Dubai wall-clock. */
export function timelineWindow(date: Date, span: 'day' | 'week'): { start: Date; end: Date } {
  const start = startOfBookingDayFor(date)

  if (span === 'day') {
    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
  }

  // Weeks run Monday to Sunday, matching how vendors talk about a working week.
  const dubaiWeekday = toBookingTz(start.toISOString()).getDay() // 0 = Sunday
  const daysSinceMonday = (dubaiWeekday + 6) % 7
  const weekStart = new Date(start.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000)

  return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
}

/**
 * Greedy sub-row assignment: each bar takes the first row whose previous bar has
 * already finished. Bars must arrive sorted by start time.
 *
 * Without this, two trips on the same vehicle in one day would draw on top of each
 * other and the second would be invisible, which is the exact double-booking the
 * vendor opened this screen to catch.
 */
function assignRows(bars: Omit<TimelineBar, 'row'>[]): TimelineBar[] {
  const rowEnds: number[] = []

  return bars.map((bar) => {
    const start = bar.leftPct
    const end = bar.leftPct + bar.widthPct

    let row = rowEnds.findIndex((rowEnd) => rowEnd <= start)
    if (row === -1) {
      row = rowEnds.length
    }

    rowEnds[row] = end
    return { ...bar, row }
  })
}

/** Smallest visible sliver, so a 10-minute job on a week view is still clickable. */
const MIN_WIDTH_PCT = 0.6

function toBar(
  event: CalendarEvent,
  windowStart: number,
  windowSpanMs: number
): Omit<TimelineBar, 'row'> | null {
  const start = event.start.getTime()
  const end = event.end.getTime()

  // Half-open: an event ending exactly at the window start does not belong here.
  if (end <= windowStart || start >= windowStart + windowSpanMs) return null

  const clampedStart = Math.max(start, windowStart)
  const clampedEnd = Math.min(end, windowStart + windowSpanMs)

  const leftPct = ((clampedStart - windowStart) / windowSpanMs) * 100
  const rawWidth = ((clampedEnd - clampedStart) / windowSpanMs) * 100

  return {
    event,
    leftPct,
    // Never let a widened sliver push past the right edge.
    widthPct: Math.min(Math.max(rawWidth, MIN_WIDTH_PCT), 100 - leftPct),
    clippedStart: start < windowStart,
    clippedEnd: end > windowStart + windowSpanMs,
  }
}

/**
 * Does this event occupy the given resource?
 *
 * Bookings carry both `vehicleId` and `driverId` because one booking holds one of
 * each. Unavailability blocks a single resource and identifies it by `resourceId`.
 * Deliberately the same rule the resource filter uses, so "belongs to this
 * resource" has one definition in the product.
 */
function belongsTo(event: CalendarEvent, resourceId: string, kind: 'vehicle' | 'driver'): boolean {
  if (event.type === 'booking') {
    return kind === 'vehicle'
      ? event.vehicleId === resourceId
      : event.driverId === resourceId
  }

  return event.resourceType === kind && event.resourceId === resourceId
}

export function buildTimelineLanes(params: {
  events: CalendarEvent[]
  vehicles: TimelineResource[]
  drivers: TimelineResource[]
  windowStart: Date
  windowEnd: Date
}): TimelineLayout {
  const { events, vehicles, drivers, windowStart, windowEnd } = params

  const startMs = windowStart.getTime()
  const spanMs = windowEnd.getTime() - startMs

  if (spanMs <= 0) {
    return {
      vehicleLanes: [],
      driverLanes: [],
      pendingBars: [],
      pendingRowCount: 1,
    }
  }

  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())

  const buildLane = (resource: TimelineResource, kind: 'vehicle' | 'driver'): TimelineLane => {
    const bars = assignRows(
      sorted
        .filter((event) => belongsTo(event, resource.id, kind))
        .map((event) => toBar(event, startMs, spanMs))
        .filter((bar): bar is Omit<TimelineBar, 'row'> => bar !== null)
    )

    return {
      resource,
      kind,
      bars,
      rowCount: Math.max(1, ...bars.map((bar) => bar.row + 1)),
    }
  }

  // A pending offer has named neither a vehicle nor a driver, so it matches no lane.
  const pendingBars = assignRows(
    sorted
      .filter((event) => event.type === 'booking' && !event.vehicleId && !event.driverId)
      .map((event) => toBar(event, startMs, spanMs))
      .filter((bar): bar is Omit<TimelineBar, 'row'> => bar !== null)
  )

  return {
    vehicleLanes: vehicles.map((vehicle) => buildLane(vehicle, 'vehicle')),
    driverLanes: drivers.map((driver) => buildLane(driver, 'driver')),
    pendingBars,
    pendingRowCount: Math.max(1, ...pendingBars.map((bar) => bar.row + 1)),
  }
}

/** Column headers: hours across a day, days across a week. */
export function timelineTicks(
  windowStart: Date,
  span: 'day' | 'week'
): { label: string; leftPct: number }[] {
  if (span === 'day') {
    // Every second hour keeps the axis readable at typical panel widths.
    return Array.from({ length: 12 }, (_, i) => ({
      label: `${String(i * 2).padStart(2, '0')}:00`,
      leftPct: (i * 2 * 100) / 24,
    }))
  }

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000)
    return {
      label: format(toBookingTz(day.toISOString()), 'EEE d'),
      leftPct: (i * 100) / 7,
    }
  })
}
