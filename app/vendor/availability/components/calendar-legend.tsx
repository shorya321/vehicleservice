'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
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

/**
 * Eight always-expanded chips over two rows cost the whole top of a phone
 * screen, so below `sm` the legend starts collapsed. It stays open on desktop,
 * where it is a reference the vendor reads while scanning the board.
 */
export function CalendarLegend() {
  const isSmallScreen = useMediaQuery('(max-width: 640px)')
  // null until the vendor touches the toggle, so the default can follow the
  // viewport without an effect fighting the state on every resize.
  const [manuallyOpen, setManuallyOpen] = useState<boolean | null>(null)
  const open = manuallyOpen ?? !isSmallScreen

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        type="button"
        onClick={() => setManuallyOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left sm:hidden"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Colour key
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <div className={cn('flex-col gap-2 p-3 pt-0 sm:flex sm:pt-3', open ? 'flex' : 'hidden')}>
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
    </div>
  )
}
