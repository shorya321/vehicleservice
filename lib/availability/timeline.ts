import { format } from 'date-fns'

import { bookingWallClockToUtc, toBookingTz } from '@/lib/utils/timezone'
import { fleetBarLabel } from '@/lib/availability/bar-label'
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
  /**
   * The TRUE proportions of the event within the window, clamped to [0, 100].
   * What the event is, not what gets drawn.
   */
  leftPct: number
  widthPct: number
  /**
   * The DRAWN box, in pixels. This is what the component renders.
   *
   * A bar narrower than its own label is widened to fit it, so `widthPx` can
   * exceed the true duration. `naturalWidthPx` records what the duration alone
   * would have drawn, which is what tells the component whether to mark the
   * real end.
   */
  leftPx: number
  widthPx: number
  naturalWidthPx: number
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

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR

export type FleetSpan = 'day' | '3day' | 'week'

/**
 * The three zoom levels, and how wide an hour is drawn at each.
 *
 * The board used to size itself to the panel, which meant a week of seven days
 * shared roughly a thousand pixels and a four-hour trip came out 12px wide with
 * its label clipped to a single character. Fixing pixels-per-hour and scrolling
 * horizontally is what makes a bar readable; the vendor picks the zoom.
 *
 * `3day` exists because Day is too narrow a horizon for dispatch and Week is too
 * dense to read a name in.
 */
export const FLEET_SPANS = {
  day: { days: 1, pxPerHour: 60, label: 'Day' },
  '3day': { days: 3, pxPerHour: 34, label: '3 Days' },
  week: { days: 7, pxPerHour: 20, label: 'Week' },
} as const satisfies Record<FleetSpan, { days: number; pxPerHour: number; label: string }>

/** Total drawn width of the time track, in pixels. */
export function timelineTrackWidth(span: FleetSpan): number {
  const { days, pxPerHour } = FLEET_SPANS[span]
  return days * 24 * pxPerHour
}

/** Midnight in Asia/Dubai for whatever day the given instant falls on. */
export function startOfBookingDayFor(date: Date): Date {
  return bookingWallClockToUtc(format(toBookingTz(date.toISOString()), 'yyyy-MM-dd'), '00:00')
}

/** The [start, end) window a fleet view covers, anchored to Dubai wall-clock. */
export function timelineWindow(date: Date, span: FleetSpan): { start: Date; end: Date } {
  const start = startOfBookingDayFor(date)

  // Day and 3-day both run forward from the day on screen: the vendor navigated
  // to it, so it belongs at the left edge rather than in the middle of a block.
  if (span !== 'week') {
    return { start, end: new Date(start.getTime() + FLEET_SPANS[span].days * MS_PER_DAY) }
  }

  // Weeks run Monday to Sunday, matching how vendors talk about a working week.
  const dubaiWeekday = toBookingTz(start.toISOString()).getDay() // 0 = Sunday
  const daysSinceMonday = (dubaiWeekday + 6) % 7
  const weekStart = new Date(start.getTime() - daysSinceMonday * MS_PER_DAY)

  return { start: weekStart, end: new Date(weekStart.getTime() + 7 * MS_PER_DAY) }
}

/**
 * Greedy sub-row assignment: each bar takes the first row whose previous bar has
 * already finished. Bars must arrive sorted by start time.
 *
 * Without this, two trips on the same vehicle in one day would draw on top of each
 * other and the second would be invisible, which is the exact double-booking the
 * vendor opened this screen to catch.
 *
 * Packed on the DRAWN box, not on the event's times. A five-minute job widened
 * to hold its label occupies far more of the lane than its duration says, and
 * packing on time would let the next bar draw straight over it.
 */
function assignRows(bars: PlacedBar[]): TimelineBar[] {
  const rowEnds: number[] = []

  return bars.map((bar) => {
    let row = rowEnds.findIndex((rowEnd) => rowEnd <= bar.leftPx + TOUCHING_TOLERANCE_PX)
    if (row === -1) {
      row = rowEnds.length
    }

    rowEnds[row] = bar.leftPx + bar.widthPx
    return { ...bar, row }
  })
}

/**
 * Sub-pixel slack, so two bars that abut exactly share a row.
 *
 * Both edges come out of the same division, and a back-to-back pair once landed
 * at 780 against 780.0000000000001 - enough to read as an overlap and stack the
 * second trip onto its own row as though the vehicle were double booked.
 * Anything under half a pixel is not a gap the vendor can see.
 */
const TOUCHING_TOLERANCE_PX = 0.5

/**
 * Width of one character of the bar label at `text-[11px] font-medium`.
 *
 * Estimated rather than measured, so the layout stays pure and testable. The
 * three real labels on the fixture data came out at 6.0, 6.3 and 6.6 px per
 * character; 6.6 is deliberately the generous end, because underestimating
 * clips text while overestimating only widens a bar slightly.
 */
const CHAR_PX = 6.6
/** Matches the bar's `px-1.5`. */
const PADDING_PX = 12
/**
 * Room for the conflict warning triangle, reserved on every bar.
 *
 * Conflicts are computed from the events after layout, and threading that state
 * back into the geometry would couple two things that have no other reason to
 * know about each other. Paying 16px uniformly is the cheaper trade.
 */
const ICON_PX = 16
/** Nothing is drawn wider than this, however long the customer name is. */
const MAX_LABEL_WIDTH_PX = 190

/** The narrowest a bar can be drawn and still show `label` in full. */
export function barMinWidthPx(label: string): number {
  return Math.min(label.length * CHAR_PX + PADDING_PX + ICON_PX, MAX_LABEL_WIDTH_PX)
}

type PlacedBar = Omit<TimelineBar, 'row'>

function toBar(
  event: CalendarEvent,
  windowStart: number,
  windowSpanMs: number,
  trackWidth: number
): PlacedBar | null {
  const start = event.start.getTime()
  const end = event.end.getTime()

  // Half-open: an event ending exactly at the window start does not belong here.
  if (end <= windowStart || start >= windowStart + windowSpanMs) return null

  const clampedStart = Math.max(start, windowStart)
  const clampedEnd = Math.min(end, windowStart + windowSpanMs)

  const leftFraction = (clampedStart - windowStart) / windowSpanMs
  const widthFraction = (clampedEnd - clampedStart) / windowSpanMs

  const leftPct = leftFraction * 100
  const widthPct = Math.min(widthFraction * 100, 100 - leftPct)

  // Drawn geometry. A bar too narrow for its own label is widened to fit it:
  // the alternative is what the vendor reported, a coloured sliver with no text
  // on it at all.
  const naturalWidthPx = widthFraction * trackWidth
  const widthPx = Math.min(
    Math.max(naturalWidthPx, barMinWidthPx(fleetBarLabel(event))),
    trackWidth
  )

  // A widened bar near the right edge would otherwise run past the end of the
  // lane. Shift it back rather than letting it overflow or get cut off.
  const leftPx = Math.max(0, Math.min(leftFraction * trackWidth, trackWidth - widthPx))

  return {
    event,
    leftPct,
    widthPct,
    leftPx,
    widthPx,
    naturalWidthPx,
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
  /** Drawn width of the time track in pixels, from `timelineTrackWidth(span)`. */
  trackWidth: number
}): TimelineLayout {
  const { events, vehicles, drivers, windowStart, windowEnd, trackWidth } = params

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
        .map((event) => toBar(event, startMs, spanMs, trackWidth))
        .filter((bar): bar is PlacedBar => bar !== null)
    )

    return {
      resource,
      kind,
      bars,
      rowCount: Math.max(1, ...bars.map((bar) => bar.row + 1)),
    }
  }

  // A pending offer has named neither a vehicle nor a driver, so it matches no lane.
  // The status check matters: a rejected or cancelled assignment also names no
  // resource, and without it the "Awaiting your response" row filled up with work
  // the vendor had already answered.
  const pendingBars = assignRows(
    sorted
      .filter(
        (event) =>
          event.type === 'booking' &&
          event.status === 'pending' &&
          !event.vehicleId &&
          !event.driverId
      )
      .map((event) => toBar(event, startMs, spanMs, trackWidth))
      .filter((bar): bar is PlacedBar => bar !== null)
  )

  return {
    vehicleLanes: vehicles.map((vehicle) => buildLane(vehicle, 'vehicle')),
    driverLanes: drivers.map((driver) => buildLane(driver, 'driver')),
    pendingBars,
    pendingRowCount: Math.max(1, ...pendingBars.map((bar) => bar.row + 1)),
  }
}

export interface TimelineTick {
  label: string
  leftPct: number
  /** Day boundaries are drawn heavier than hour marks. */
  major: boolean
}

/**
 * Column headers and the guide lines beneath them.
 *
 * One array serves both, because they used to be computed separately: the header
 * showed seven day labels across a week while the lanes drew twelve evenly
 * spaced guides, so every guide line landed 14 hours away from the label above
 * it.
 */
export function timelineTicks(windowStart: Date, span: FleetSpan): TimelineTick[] {
  const { days } = FLEET_SPANS[span]
  const totalHours = days * 24

  // Hours per tick, chosen so a tick is never closer than ~56px at that zoom.
  const step = span === 'day' ? 2 : span === '3day' ? 6 : 12

  return Array.from({ length: totalHours / step }, (_, i) => {
    const hour = i * step
    const instant = new Date(windowStart.getTime() + hour * MS_PER_HOUR)
    const dubai = toBookingTz(instant.toISOString())
    const isDayStart = hour % 24 === 0

    return {
      // On multi-day spans the midnight tick carries the date, so the vendor can
      // tell Tuesday 08:00 from Wednesday 08:00 without counting columns.
      label: isDayStart && days > 1 ? format(dubai, 'EEE d') : format(dubai, 'HH:mm'),
      leftPct: (hour / totalHours) * 100,
      major: isDayStart,
    }
  })
}
