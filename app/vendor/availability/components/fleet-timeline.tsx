'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { Car, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import {
  buildTimelineLanes,
  timelineTicks,
  timelineWindow,
  type TimelineBar,
  type TimelineLane,
  type TimelineResource,
} from '@/lib/availability/timeline'
import { CALENDAR_COLORS, type CalendarEvent } from '../types'

interface FleetTimelineProps {
  events: CalendarEvent[]
  vehicles: TimelineResource[]
  drivers: TimelineResource[]
  date: Date
  span: 'day' | 'week'
  onSelectEvent: (event: CalendarEvent) => void
}

/** Height of one sub-row of bars. Lanes grow in multiples of this when trips overlap. */
const ROW_HEIGHT = 26
const LANE_LABEL_WIDTH = 'w-44'

function barTitle(bar: TimelineBar): string {
  const { event } = bar
  const start = format(toBookingTz(event.start.toISOString()), 'dd MMM HH:mm')
  const end = format(toBookingTz(event.end.toISOString()), 'dd MMM HH:mm')
  return `${event.title}\n${start} - ${end}`
}

function Bar({ bar, onSelect }: { bar: TimelineBar; onSelect: () => void }) {
  const { event } = bar
  const color = event.color ?? CALENDAR_COLORS.onlineUpcoming
  const past = event.end < new Date()

  // Same rule the month view uses: hatched only when it holds nothing AND has not
  // already happened. Past bars are dimmed instead, so history reads as history.
  const unreserved = !event.occupies && !past

  return (
    <button
      type="button"
      onClick={onSelect}
      title={barTitle(bar)}
      className={cn(
        'absolute top-0.5 h-[22px] overflow-hidden rounded px-1.5 text-left text-[11px] font-medium leading-[22px]',
        'transition-shadow hover:z-10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        bar.clippedStart && 'rounded-l-none',
        bar.clippedEnd && 'rounded-r-none'
      )}
      style={{
        left: `${bar.leftPct}%`,
        width: `${bar.widthPct}%`,
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
      <span className="truncate">{event.title}</span>
    </button>
  )
}

function Lane({
  lane,
  onSelectEvent,
}: {
  lane: TimelineLane
  onSelectEvent: (event: CalendarEvent) => void
}) {
  const height = lane.rowCount * ROW_HEIGHT

  return (
    <div className="flex border-b border-border/60 last:border-b-0">
      <div
        className={cn(
          LANE_LABEL_WIDTH,
          'shrink-0 border-r border-border/60 px-3 py-1.5 text-sm'
        )}
      >
        <div className="truncate font-medium">{lane.resource.label}</div>
        {lane.resource.sublabel && (
          <div className="truncate text-xs text-muted-foreground">
            {lane.resource.sublabel}
          </div>
        )}
      </div>

      <div className="relative flex-1" style={{ height }}>
        {/* Column guides, matching the header ticks. */}
        <div className="pointer-events-none absolute inset-0 flex">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex-1 border-r border-border/30 last:border-r-0" />
          ))}
        </div>

        {lane.resource.outOfService ? (
          <div className="absolute inset-x-0 top-0.5 h-[22px] rounded bg-muted px-2 text-[11px] leading-[22px] text-muted-foreground">
            {lane.resource.outOfService}
          </div>
        ) : lane.bars.length === 0 ? (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground/70">
            Free all {lane.rowCount > 0 ? 'period' : ''}
          </span>
        ) : null}

        {lane.bars.map((bar) => (
          <div
            key={bar.event.id}
            className="absolute inset-x-0"
            style={{ top: bar.row * ROW_HEIGHT }}
          >
            <Bar bar={bar} onSelect={() => onSelectEvent(bar.event)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupHeader({ icon: Icon, title, count }: { icon: typeof Car; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <span className="text-xs text-muted-foreground/70">({count})</span>
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
 */
export function FleetTimeline({
  events,
  vehicles,
  drivers,
  date,
  span,
  onSelectEvent,
}: FleetTimelineProps) {
  const { start, end } = useMemo(() => timelineWindow(date, span), [date, span])

  const layout = useMemo(
    () =>
      buildTimelineLanes({
        events,
        vehicles,
        drivers,
        windowStart: start,
        windowEnd: end,
      }),
    [events, vehicles, drivers, start, end]
  )

  const ticks = useMemo(() => timelineTicks(start, span), [start, span])

  const rangeLabel =
    span === 'day'
      ? format(toBookingTz(start.toISOString()), 'EEEE, d MMM yyyy')
      : `${format(toBookingTz(start.toISOString()), 'd MMM')} - ${format(
          toBookingTz(new Date(end.getTime() - 1).toISOString()),
          'd MMM yyyy'
        )}`

  const hasFleet = vehicles.length > 0 || drivers.length > 0

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{rangeLabel}</span>
        <span className="text-xs text-muted-foreground">Times shown in Dubai time</span>
      </div>

      {/* Time axis */}
      <div className="flex border-b bg-muted/30">
        <div className={cn(LANE_LABEL_WIDTH, 'shrink-0 border-r border-border/60')} />
        <div className="relative h-7 flex-1">
          {ticks.map((tick) => (
            <span
              key={tick.label}
              className="absolute top-1 text-[11px] text-muted-foreground"
              style={{ left: `${tick.leftPct}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      {!hasFleet ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          Add a vehicle or a driver to see your fleet schedule here.
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
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
                onSelectEvent={onSelectEvent}
              />
            </>
          )}

          <GroupHeader icon={Car} title="Vehicles" count={vehicles.length} />
          {layout.vehicleLanes.map((lane) => (
            <Lane key={lane.resource.id} lane={lane} onSelectEvent={onSelectEvent} />
          ))}

          <GroupHeader icon={User} title="Drivers" count={drivers.length} />
          {layout.driverLanes.map((lane) => (
            <Lane key={lane.resource.id} lane={lane} onSelectEvent={onSelectEvent} />
          ))}
        </div>
      )}
    </div>
  )
}
