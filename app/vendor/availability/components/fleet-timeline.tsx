'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Car, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import {
  FLEET_SPANS,
  buildTimelineLanes,
  timelineTicks,
  timelineTrackWidth,
  timelineWindow,
  type FleetSpan,
  type TimelineBar,
  type TimelineLane,
  type TimelineResource,
  type TimelineTick,
} from '@/lib/availability/timeline'
import { fleetBarLabel } from '@/lib/availability/bar-label'
import { CALENDAR_COLORS, type CalendarEvent } from '../types'

interface FleetTimelineProps {
  events: CalendarEvent[]
  vehicles: TimelineResource[]
  drivers: TimelineResource[]
  date: Date
  span: FleetSpan
  /** Per resource id, the events that clash with another job on that same resource. */
  conflictsByResource: Map<string, Set<string>>
  onSelectEvent: (event: CalendarEvent) => void
}

/** Height of one sub-row of bars. Lanes grow in multiples of this when trips overlap. */
const ROW_HEIGHT = 26
const LANE_LABEL_WIDTH = 'w-44'
/** The same 11rem in pixels. The now-marker is positioned against the whole
 *  scrolled row (label column plus track), so a percentage of the track
 *  alone will not place it. */
const LANE_LABEL_PX = 176

/** Shared empty set, so lanes with no clash do not allocate one per render. */
const EMPTY_CONFLICTS: Set<string> = new Set()

function barTitle(bar: TimelineBar, conflicting: boolean): string {
  const { event } = bar
  const start = format(toBookingTz(event.start.toISOString()), 'dd MMM HH:mm')
  const end = format(toBookingTz(event.end.toISOString()), 'dd MMM HH:mm')
  const clash = conflicting ? '\nDouble booked: this resource is committed elsewhere at the same time.' : ''
  return `${event.title}\n${start} - ${end}${clash}`
}

function Bar({
  bar,
  conflicting,
  onSelect,
}: {
  bar: TimelineBar
  conflicting: boolean
  onSelect: () => void
}) {
  const { event } = bar
  const color = event.color ?? CALENDAR_COLORS.onlineUpcoming
  const past = event.end < new Date()

  // Same rule the month view uses: hatched only when it holds nothing AND has not
  // already happened. Past bars are dimmed instead, so history reads as history.
  const unreserved = !event.occupies && !past

  // Widened to fit its label, so the drawn box says more time than the event
  // takes. Mark where the job really ends; the exact times are in the tooltip
  // and the dialog, but a board should not have to be hovered to be honest.
  const widened = bar.widthPx - bar.naturalWidthPx > 1

  return (
    <button
      type="button"
      onClick={onSelect}
      title={barTitle(bar, conflicting)}
      className={cn(
        'absolute top-0.5 h-[22px] overflow-hidden rounded px-1.5 text-left text-[11px] font-medium leading-[22px]',
        'transition-shadow hover:z-10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        bar.clippedStart && 'rounded-l-none',
        bar.clippedEnd && 'rounded-r-none',
        conflicting && 'z-10 ring-2 ring-destructive ring-offset-1 ring-offset-background'
      )}
      style={{
        left: bar.leftPx,
        width: bar.widthPx,
        opacity: past ? 0.6 : 1,
        ...(unreserved
          ? {
              backgroundColor: CALENDAR_COLORS.pendingFill,
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, ${color}44 4px, ${color}44 8px)`,
              border: `1.5px dashed ${color}`,
              color: CALENDAR_COLORS.pendingText,
            }
          : { backgroundColor: color, color: 'white' }),
      }}
    >
      {/* Crop marks, not a rule. The box is wider than the job so the label
          fits; these say where the job really ends without crossing a glyph. */}
      {widened && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px opacity-70"
          style={{
            left: Math.max(1, bar.naturalWidthPx),
            backgroundImage:
              'linear-gradient(to bottom, currentColor 0 4px, transparent 4px calc(100% - 4px), currentColor calc(100% - 4px) 100%)',
          }}
        />
      )}

      {/* `truncate` needs a block box: on the inline span this used to be, the
          ellipsis never rendered and the parent's overflow cut mid-glyph. */}
      <span className="relative flex w-full items-center gap-1 truncate">
        {conflicting && <AlertTriangle className="h-3 w-3 shrink-0" />}
        <span className="truncate">{fleetBarLabel(event)}</span>
      </span>
    </button>
  )
}

function Lane({
  lane,
  ticks,
  trackWidth,
  conflictIds,
  onSelectEvent,
}: {
  lane: TimelineLane
  ticks: TimelineTick[]
  trackWidth: number
  conflictIds: Set<string>
  onSelectEvent: (event: CalendarEvent) => void
}) {
  const height = lane.rowCount * ROW_HEIGHT
  const hasConflict = lane.bars.some((bar) => conflictIds.has(bar.event.id))

  return (
    <div className="flex border-b border-border/60 last:border-b-0">
      <div
        className={cn(
          LANE_LABEL_WIDTH,
          // Sticky so the fleet stays identifiable while the board scrolls sideways.
          'sticky left-0 z-20 shrink-0 border-r border-border/60 bg-background px-3 py-1.5 text-sm'
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{lane.resource.label}</span>
          {hasConflict && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
        </div>
        {lane.resource.sublabel && (
          <div className="truncate text-xs text-muted-foreground">
            {lane.resource.sublabel}
          </div>
        )}
      </div>

      <div className="relative shrink-0" style={{ height, width: trackWidth }}>
        {/* Column guides, from the same ticks the header renders. */}
        <div className="pointer-events-none absolute inset-0">
          {ticks.map((tick) => (
            <div
              key={tick.leftPct}
              className={cn(
                'absolute inset-y-0 border-l',
                tick.major ? 'border-border/70' : 'border-border/25'
              )}
              style={{ left: `${tick.leftPct}%` }}
            />
          ))}
        </div>

        {lane.resource.outOfService ? (
          <div className="absolute inset-x-0 top-0.5 h-[22px] rounded bg-muted px-2 text-[11px] leading-[22px] text-muted-foreground">
            {lane.resource.outOfService}
          </div>
        ) : lane.bars.length === 0 ? (
          // Sticky rather than centred: centring spans the whole scrolled track,
          // which parks the label off screen on anything wider than a day.
          <div className="pointer-events-none sticky left-44 top-0 z-0 w-max py-1 pl-3 text-[11px] leading-[22px] text-muted-foreground/70">
            Free all period
          </div>
        ) : null}

        {lane.bars.map((bar) => (
          <div
            key={bar.event.id}
            className="absolute inset-x-0"
            style={{ top: bar.row * ROW_HEIGHT }}
          >
            <Bar
              bar={bar}
              conflicting={conflictIds.has(bar.event.id)}
              onSelect={() => onSelectEvent(bar.event)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupHeader({ icon: Icon, title, count }: { icon: typeof Car; title: string; count: number }) {
  return (
    <div className="border-b bg-muted/50">
      {/* The row spans the full scrolled width, so the label itself has to stick;
          pinning the row would leave its content scrolled off to the left. */}
      <div className="sticky left-0 flex w-max items-center gap-2 px-3 py-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground/70">({count})</span>
      </div>
    </div>
  )
}

/**
 * One row per vehicle and per driver, time across the top.
 *
 * This is the view that answers the question the month grid cannot: not "is
 * something booked on Thursday" but "which of my cars and drivers is free at 15:00
 * on Thursday". An empty lane crossing the time you care about IS the answer, and
 * it costs no extra query: this consumes the events the calendar already loaded.
 *
 * The track is a fixed number of pixels per hour and scrolls horizontally. Sizing
 * it to the panel instead meant a week shared a thousand pixels between 168
 * hours, and every bar came out too narrow to carry its own name.
 */
export function FleetTimeline({
  events,
  vehicles,
  drivers,
  date,
  span,
  conflictsByResource,
  onSelectEvent,
}: FleetTimelineProps) {
  const { start, end } = useMemo(() => timelineWindow(date, span), [date, span])

  const ticks = useMemo(() => timelineTicks(start, span), [start, span])
  const trackWidth = timelineTrackWidth(span)

  const layout = useMemo(
    () =>
      buildTimelineLanes({
        events,
        vehicles,
        drivers,
        windowStart: start,
        windowEnd: end,
        trackWidth,
      }),
    [events, vehicles, drivers, start, end, trackWidth]
  )

  // The current instant, refreshed each minute so the marker below creeps across
  // the board. Read in an effect rather than during render: the clock is not a
  // pure input, and a render that reads it cannot be replayed.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const frame = requestAnimationFrame(tick)
    const interval = setInterval(tick, 60_000)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(interval)
    }
  }, [])

  // Where "now" falls in the window, or null when the window is another day.
  const nowLeftPct = useMemo(() => {
    if (now === null || now < start.getTime() || now >= end.getTime()) return null
    return ((now - start.getTime()) / (end.getTime() - start.getTime())) * 100
  }, [now, start, end])

  // Open on the current time rather than at 00:00, which on a day view is eight
  // hours of empty track before anything happens.
  //
  // Keyed on the window, not on `now`: the marker ticks every minute, and
  // re-running this on each tick would yank the board back from wherever the
  // vendor had scrolled it.
  const scrollRef = useRef<HTMLDivElement>(null)
  const windowStartMs = start.getTime()
  const windowEndMs = end.getTime()
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const now = Date.now()

    // A window that does not contain now rewinds to its start, or the board keeps
    // the offset from the previous window and opens partway through a week the
    // vendor has not looked at yet.
    if (now < windowStartMs || now >= windowEndMs) {
      container.scrollLeft = 0
      return
    }

    const nowPct = (now - windowStartMs) / (windowEndMs - windowStartMs)
    container.scrollLeft = Math.max(0, nowPct * trackWidth - container.clientWidth / 3)
  }, [windowStartMs, windowEndMs, trackWidth])

  const rangeLabel =
    span === 'day'
      ? format(toBookingTz(start.toISOString()), 'EEEE, d MMM yyyy')
      : `${format(toBookingTz(start.toISOString()), 'd MMM')} - ${format(
          toBookingTz(new Date(end.getTime() - 1).toISOString()),
          'd MMM yyyy'
        )}`

  const hasFleet = vehicles.length > 0 || drivers.length > 0
  const hasBars =
    layout.pendingBars.length > 0 ||
    layout.vehicleLanes.some((lane) => lane.bars.length > 0) ||
    layout.driverLanes.some((lane) => lane.bars.length > 0)

  if (!hasFleet) {
    return (
      <div className="rounded-lg border px-3 py-8 text-center text-sm text-muted-foreground">
        No vehicles or drivers match these filters.
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <span className="text-sm font-medium">{rangeLabel}</span>
        <span className="text-xs text-muted-foreground">
          Times shown in Dubai time · {FLEET_SPANS[span].pxPerHour >= 28 ? 'scroll sideways for later hours' : 'scroll sideways for the rest of the week'}
        </span>
      </div>

      {!hasBars && (
        <div className="border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No bookings match these filters in this period. Every lane below is free.
        </div>
      )}

      {/* One scroll container for the axis and every lane, so the header cannot
          drift out of step with the bars underneath it. */}
      <div ref={scrollRef} className="max-h-[clamp(360px,60vh,640px)] overflow-auto">
        <div className="relative w-max min-w-full">
          {/* Where we are now, drawn once rather than once per lane. As a
              positioned z-0 element placed first it paints above the lane rows
              and group bands, so the line is continuous down the board, but
              below the sticky name column, the sticky axis and every lane
              track, so it can no longer cut through a label. */}
          {nowLeftPct !== null && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-0 w-px bg-accent/80"
              style={{ left: LANE_LABEL_PX + (nowLeftPct / 100) * trackWidth }}
            />
          )}

          {/* Time axis */}
          <div className="sticky top-0 z-30 flex border-b bg-muted">
            <div
              className={cn(
                LANE_LABEL_WIDTH,
                'sticky left-0 z-10 shrink-0 border-r border-border/60 bg-muted'
              )}
            />
            <div className="relative h-7 shrink-0" style={{ width: trackWidth }}>
              {ticks.map((tick, index) => (
                <span
                  key={tick.leftPct}
                  className={cn(
                    'absolute top-1 whitespace-nowrap text-[11px]',
                    tick.major ? 'font-medium text-foreground' : 'text-muted-foreground',
                    // Centred on the gridline, except at the edges where that
                    // would push the label outside the track.
                    index === 0 ? 'translate-x-0' : '-translate-x-1/2'
                  )}
                  style={{ left: `${tick.leftPct}%` }}
                >
                  {tick.label}
                </span>
              ))}

              {nowLeftPct !== null && (
                <span
                  className="absolute bottom-0 z-10 -translate-x-1/2 rounded-t-[3px] bg-accent px-1.5 py-px text-[10px] font-semibold uppercase leading-none tracking-wide text-accent-foreground"
                  style={{ left: `${nowLeftPct}%` }}
                >
                  Now
                </span>
              )}
            </div>
          </div>

          {layout.pendingBars.length > 0 && (
            <>
              <GroupHeader icon={User} title="Awaiting your response" count={layout.pendingBars.length} />
              <Lane
                lane={{
                  resource: {
                    id: 'pending',
                    label: 'Unassigned offers',
                    sublabel: 'No vehicle or driver reserved yet',
                  },
                  kind: 'vehicle',
                  bars: layout.pendingBars,
                  rowCount: layout.pendingRowCount,
                }}
                ticks={ticks}
                trackWidth={trackWidth}
                conflictIds={EMPTY_CONFLICTS}
                onSelectEvent={onSelectEvent}
              />
            </>
          )}

          {layout.vehicleLanes.length > 0 && (
            <>
              <GroupHeader icon={Car} title="Vehicles" count={layout.vehicleLanes.length} />
              {layout.vehicleLanes.map((lane) => (
                <Lane
                  key={lane.resource.id}
                  lane={lane}
                  ticks={ticks}
                  trackWidth={trackWidth}
                  conflictIds={conflictsByResource.get(lane.resource.id) ?? EMPTY_CONFLICTS}
                  onSelectEvent={onSelectEvent}
                />
              ))}
            </>
          )}

          {layout.driverLanes.length > 0 && (
            <>
              <GroupHeader icon={User} title="Drivers" count={layout.driverLanes.length} />
              {layout.driverLanes.map((lane) => (
                <Lane
                  key={lane.resource.id}
                  lane={lane}
                  ticks={ticks}
                  trackWidth={trackWidth}
                  conflictIds={conflictsByResource.get(lane.resource.id) ?? EMPTY_CONFLICTS}
                  onSelectEvent={onSelectEvent}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
