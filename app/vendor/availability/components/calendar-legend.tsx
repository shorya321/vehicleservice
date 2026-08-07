'use client'

import { CALENDAR_COLORS } from '../types'

/**
 * Two cues per entry, never colour alone: hue says where the occupancy came from,
 * and a solid vs. dashed swatch says whether it actually holds the vehicle and
 * driver. A vendor who cannot distinguish violet from blue can still tell a
 * reserved slot from a released one.
 */

interface SwatchProps {
  color: string
  /** Dashed and hatched, matching how the calendar draws non-occupying events. */
  outlined?: boolean
  label: string
}

function Swatch({ color, outlined, label }: SwatchProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 rounded"
        style={
          outlined
            ? {
                backgroundColor: CALENDAR_COLORS.pendingFill,
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, ${color}55 3px, ${color}55 6px)`,
                border: `2px dashed ${color}`,
              }
            : { backgroundColor: color }
        }
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-14 shrink-0">
        {title}
      </span>
      {children}
    </div>
  )
}

export function CalendarLegend() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <Group title="Online">
        <Swatch color={CALENDAR_COLORS.onlineUpcoming} label="Upcoming" />
        <Swatch color={CALENDAR_COLORS.onlinePastRan} label="Completed" />
        <Swatch color={CALENDAR_COLORS.pastNoTrip} label="Cancelled / no trip" />
        <Swatch
          color={CALENDAR_COLORS.pendingBorder}
          outlined
          label="Awaiting your response"
        />
      </Group>
      <Group title="Offline">
        <Swatch color={CALENDAR_COLORS.offlineUpcoming} label="Upcoming" />
        <Swatch color={CALENDAR_COLORS.offlineCompleted} label="Completed" />
        <Swatch color={CALENDAR_COLORS.pastNoTrip} outlined label="Cancelled" />
        <Swatch color={CALENDAR_COLORS.blocked} label="Blocked (maintenance / leave)" />
      </Group>
    </div>
  )
}
