// Imported only by availability-calendar.tsx, which is already a client entry.
import { useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { toBookingTz } from '@/lib/utils/timezone'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '../types'
import type { ResourceConflict } from '@/lib/availability/conflicts'

function window_(event: CalendarEvent): string {
  const start = format(toBookingTz(event.start.toISOString()), 'dd MMM HH:mm')
  const end = format(toBookingTz(event.end.toISOString()), 'HH:mm')
  return `${start} - ${end}`
}

/**
 * Names every double-booking in the visible period.
 *
 * Shown in both Calendar and Fleet mode. The Fleet lanes also ring the offending
 * bars, but react-big-calendar has no per-resource row to ring, so without this
 * banner a clash is invisible in three of the four views.
 */
export function ConflictBanner({
  conflicts,
  onSelectEvent,
}: {
  conflicts: ResourceConflict[]
  onSelectEvent: (event: CalendarEvent) => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (conflicts.length === 0) return null

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        <span className="text-sm font-medium text-destructive">
          {conflicts.length === 1
            ? '1 scheduling conflict in this period'
            : `${conflicts.length} scheduling conflicts in this period`}
        </span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 text-destructive transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <ul className="space-y-2 border-t border-destructive/30 px-3 py-2">
          {conflicts.map((conflict) => (
            <li
              key={`${conflict.resourceId}-${conflict.events[0].id}-${conflict.events[1].id}`}
              className="text-sm"
            >
              <span className="font-medium">{conflict.resourceLabel}</span>
              <span className="text-muted-foreground"> is double booked:</span>
              <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                {conflict.events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="rounded border border-destructive/40 bg-background px-2 py-1 text-left text-xs hover:bg-accent"
                  >
                    <span className="font-medium">{event.title}</span>{' '}
                    <span className="text-muted-foreground">{window_(event)}</span>
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
