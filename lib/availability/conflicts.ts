/**
 * Double-booking detection for the availability calendar.
 *
 * The Fleet timeline already stacks overlapping bars into sub-rows, which is
 * tidy but silent: two jobs on one car at the same hour looked exactly like two
 * jobs on one car at different hours. This module names the overlap so the
 * screen answers the question the vendor actually opened it to ask.
 *
 * Read-only. It reports on data that already exists; the write paths
 * (`markResourceUnavailable`, `createDirectBooking`, `acceptAndAssignResources`)
 * are what prevent conflicts being created, and the database exclusion
 * constraints are the last line of defence.
 */

import type { CalendarEvent } from '@/app/vendor/availability/types'

export type ResourceKind = 'vehicle' | 'driver'

export interface ResourceConflict {
  resourceId: string
  resourceKind: ResourceKind
  /** Display name of the vehicle or driver, for the banner. */
  resourceLabel: string
  /** The two events that overlap, earliest start first. */
  events: [CalendarEvent, CalendarEvent]
}

/**
 * True when the event holds `resourceId` for the whole of its window.
 *
 * Only occupying events count. A pending offer reserves nothing until the vendor
 * accepts it, and a completed or cancelled booking has released its resources -
 * flagging either as a clash would train the vendor to ignore the warning.
 */
function holdsResource(event: CalendarEvent, resourceId: string, kind: ResourceKind): boolean {
  if (!event.occupies) return false

  if (event.type === 'booking') {
    return kind === 'vehicle' ? event.vehicleId === resourceId : event.driverId === resourceId
  }

  return event.resourceType === kind && event.resourceId === resourceId
}

/** Half-open overlap, matching the `[)` range the database exclusion constraints
 *  use. Back-to-back trips (one ends exactly as the next starts) do not clash. */
function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
  return a.start < b.end && b.start < a.end
}

/**
 * Every pair of events that hold the same resource at the same time.
 *
 * `resources` is the visible fleet, so a lane the filters have hidden cannot
 * contribute a conflict the vendor has no way to see.
 */
export function findResourceConflicts(
  events: CalendarEvent[],
  resources: { id: string; label: string; kind: ResourceKind }[]
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = []

  for (const resource of resources) {
    const held = events
      .filter((event) => holdsResource(event, resource.id, resource.kind))
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    // Sorted by start, so the inner loop can stop as soon as a later event
    // begins at or after the current one ends.
    for (let i = 0; i < held.length; i++) {
      for (let j = i + 1; j < held.length; j++) {
        if (held[j].start >= held[i].end) break
        if (overlaps(held[i], held[j])) {
          conflicts.push({
            resourceId: resource.id,
            resourceKind: resource.kind,
            resourceLabel: resource.label,
            events: [held[i], held[j]],
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * Conflicting event ids, grouped by the resource they clash on.
 *
 * Grouped rather than flat because one booking holds a vehicle AND a driver. A
 * maintenance block clashing with a trip is a clash on that *vehicle*; the
 * driver is not double booked, and flagging their lane too would report a
 * problem the vendor cannot find.
 */
export function conflictsByResource(conflicts: ResourceConflict[]): Map<string, Set<string>> {
  const byResource = new Map<string, Set<string>>()

  for (const conflict of conflicts) {
    const ids = byResource.get(conflict.resourceId) ?? new Set<string>()
    ids.add(conflict.events[0].id)
    ids.add(conflict.events[1].id)
    byResource.set(conflict.resourceId, ids)
  }

  return byResource
}
