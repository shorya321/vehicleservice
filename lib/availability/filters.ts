/**
 * The availability calendar's client-side filter predicate.
 *
 * Extracted from the component so it can be tested directly: it decides what a
 * vendor sees on a screen whose whole purpose is answering "what is free?", and
 * a silent over-filter there looks exactly like an empty schedule.
 *
 * The server action only takes a date range. Everything below runs in the
 * browser over the events already fetched for that range.
 */

import { isReleased, type CalendarEvent, type CalendarEventSource } from '@/app/vendor/availability/types'

export type ResourceTypeFilter = 'all' | 'vehicle' | 'driver'
export type SourceFilter = 'all' | CalendarEventSource

export interface CalendarFilters {
  /** Which kind of resource the vendor is looking at. */
  filterType: ResourceTypeFilter
  /** A specific vehicle or driver id, or `'all'`. */
  selectedResourceFilter: string
  /** Where the occupancy came from. */
  sourceFilter: SourceFilter
  /** Include completed / cancelled / rejected work. */
  showReleased: boolean
}

/**
 * True when `event` belongs to the given resource-type tab.
 *
 * A booking occupies a vehicle *and* a driver, so it belongs to a tab only if it
 * actually has a resource of that kind assigned. Matching on `type === 'booking'`
 * alone would let every booking through both tabs.
 */
export function matchesResourceType(
  event: Pick<CalendarEvent, 'type' | 'vehicleId' | 'driverId' | 'resourceType'>,
  filterType: ResourceTypeFilter
): boolean {
  if (filterType === 'all') return true

  if (event.type === 'booking') {
    return filterType === 'vehicle' ? !!event.vehicleId : !!event.driverId
  }

  return event.resourceType === filterType
}

/** True when `event` belongs to the given resource id. */
export function matchesResource(
  event: Pick<CalendarEvent, 'type' | 'vehicleId' | 'driverId' | 'resourceId'>,
  resourceId: string
): boolean {
  if (resourceId === 'all') return true

  return event.type === 'booking'
    ? event.vehicleId === resourceId || event.driverId === resourceId
    : event.resourceId === resourceId
}

/** Applies every active filter, in the order the UI presents them. */
export function filterCalendarEvents<T extends CalendarEvent>(
  events: T[],
  filters: CalendarFilters
): T[] {
  const { filterType, selectedResourceFilter, sourceFilter, showReleased } = filters

  return events.filter((event) => {
    if (!matchesResourceType(event, filterType)) return false

    // Where the occupancy came from.
    if (sourceFilter !== 'all' && event.source !== sourceFilter) return false

    // Completed and cancelled trips hold nothing, so they are history rather
    // than schedule. Keyed off status, not `!occupies`: pending offers are also
    // non-occupying, and a switch labelled "completed & cancelled" must never
    // hide work the vendor still owes an answer on.
    if (!showReleased && isReleased(event)) return false

    if (!matchesResource(event, selectedResourceFilter)) return false

    return true
  })
}

/**
 * Narrows a resource list to what the filters leave visible.
 *
 * The Fleet view draws one lane per resource. Those lanes came straight from the
 * unfiltered props, so choosing "Vehicles" still rendered every driver lane with
 * its bookings intact. Lanes have to be filtered alongside the events or the
 * filter reads as broken.
 */
export function filterResources<T extends { id: string }>(
  resources: T[],
  kind: 'vehicle' | 'driver',
  filters: Pick<CalendarFilters, 'filterType' | 'selectedResourceFilter'>
): T[] {
  const { filterType, selectedResourceFilter } = filters

  if (filterType !== 'all' && filterType !== kind) return []
  if (selectedResourceFilter === 'all') return resources

  // A specific resource is only ever of one kind, so the other lane list empties.
  return resources.filter((resource) => resource.id === selectedResourceFilter)
}
