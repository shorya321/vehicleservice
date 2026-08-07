import {
  filterCalendarEvents,
  filterResources,
  type CalendarFilters,
} from '@/lib/availability/filters'
import type { CalendarEvent } from '@/app/vendor/availability/types'

/**
 * The calendar's client-side filter predicate.
 *
 * This decides what a vendor sees on a screen whose whole purpose is answering
 * "what is free?". An over-filter here is indistinguishable from an empty
 * schedule, which is why it is tested away from the DOM.
 */

const VEHICLE_ID = 'veh-1'
const OTHER_VEHICLE_ID = 'veh-2'
const DRIVER_ID = 'drv-1'

const ALL_OFF: CalendarFilters = {
  filterType: 'all',
  selectedResourceFilter: 'all',
  sourceFilter: 'all',
  showReleased: false,
}

function event(overrides: Partial<CalendarEvent> & { id: string }): CalendarEvent {
  return {
    title: 'Trip',
    start: new Date('2026-08-10T05:00:00Z'),
    end: new Date('2026-08-10T09:00:00Z'),
    resourceId: overrides.id,
    resourceType: 'booking',
    type: 'booking',
    vehicleId: VEHICLE_ID,
    driverId: DRIVER_ID,
    source: 'online',
    occupies: true,
    ...overrides,
  }
}

/** One of everything the calendar can draw. */
const EVENTS: CalendarEvent[] = [
  event({ id: 'online-upcoming', source: 'online', status: 'accepted' }),
  event({ id: 'online-done', source: 'online', status: 'completed', occupies: false }),
  event({ id: 'online-pending', source: 'online', status: 'pending', occupies: false, vehicleId: null, driverId: null }),
  event({ id: 'offline-upcoming', source: 'offline', status: 'confirmed', vehicleId: OTHER_VEHICLE_ID }),
  event({ id: 'offline-cancelled', source: 'offline', status: 'cancelled', occupies: false }),
  event({
    id: 'blocked-vehicle',
    type: 'unavailable',
    source: 'blocked',
    resourceType: 'vehicle',
    resourceId: VEHICLE_ID,
    vehicleId: null,
    driverId: null,
  }),
  event({
    id: 'blocked-driver',
    type: 'unavailable',
    source: 'blocked',
    resourceType: 'driver',
    resourceId: DRIVER_ID,
    vehicleId: null,
    driverId: null,
  }),
]

const idsOf = (events: CalendarEvent[]) => events.map((e) => e.id).sort()

describe('filterCalendarEvents: resource type', () => {
  it('passes everything through on All', () => {
    expect(filterCalendarEvents(EVENTS, { ...ALL_OFF, showReleased: true })).toHaveLength(EVENTS.length)
  })

  it('keeps only bookings that actually name a vehicle, plus vehicle blocks', () => {
    const result = filterCalendarEvents(EVENTS, {
      ...ALL_OFF,
      filterType: 'vehicle',
      showReleased: true,
    })

    expect(idsOf(result)).toEqual(
      ['blocked-vehicle', 'offline-cancelled', 'offline-upcoming', 'online-done', 'online-upcoming'].sort()
    )
    // A pending offer names no resource, so it belongs to neither tab.
    expect(idsOf(result)).not.toContain('online-pending')
    expect(idsOf(result)).not.toContain('blocked-driver')
  })

  it('keeps only bookings that actually name a driver, plus driver blocks', () => {
    const result = filterCalendarEvents(EVENTS, {
      ...ALL_OFF,
      filterType: 'driver',
      showReleased: true,
    })

    expect(idsOf(result)).toContain('blocked-driver')
    expect(idsOf(result)).not.toContain('blocked-vehicle')
  })
})

describe('filterCalendarEvents: booking source', () => {
  it('splits the unfiltered set exactly, with nothing lost or double counted', () => {
    const all = filterCalendarEvents(EVENTS, { ...ALL_OFF, showReleased: true })
    const bySource = (['online', 'offline', 'blocked'] as const).map(
      (sourceFilter) =>
        filterCalendarEvents(EVENTS, { ...ALL_OFF, sourceFilter, showReleased: true }).length
    )

    expect(bySource.reduce((sum, n) => sum + n, 0)).toBe(all.length)
  })

  it('returns only the chosen source', () => {
    const offline = filterCalendarEvents(EVENTS, {
      ...ALL_OFF,
      sourceFilter: 'offline',
      showReleased: true,
    })

    expect(offline.every((e) => e.source === 'offline')).toBe(true)
  })
})

describe('filterCalendarEvents: show completed and cancelled', () => {
  it('hides completed and cancelled work by default', () => {
    const result = idsOf(filterCalendarEvents(EVENTS, ALL_OFF))

    expect(result).not.toContain('online-done')
    expect(result).not.toContain('offline-cancelled')
  })

  it('never hides a pending offer, which is work the vendor still owes an answer on', () => {
    expect(idsOf(filterCalendarEvents(EVENTS, ALL_OFF))).toContain('online-pending')
  })

  it('restores released work when switched on', () => {
    const result = idsOf(filterCalendarEvents(EVENTS, { ...ALL_OFF, showReleased: true }))

    expect(result).toContain('online-done')
    expect(result).toContain('offline-cancelled')
  })
})

describe('filterCalendarEvents: specific resource', () => {
  it('matches a booking on either of its two resources', () => {
    const result = idsOf(
      filterCalendarEvents(EVENTS, {
        ...ALL_OFF,
        selectedResourceFilter: DRIVER_ID,
        showReleased: true,
      })
    )

    expect(result).toContain('online-upcoming')
    expect(result).toContain('blocked-driver')
    // A booking on a different vehicle still matches, because it is this driver
    // who is committed. Picking a driver must not hide their own work.
    expect(result).toContain('offline-upcoming')
    // A block on the vehicle leaves the driver free.
    expect(result).not.toContain('blocked-vehicle')
  })

  it('combines with source and released filters', () => {
    const result = idsOf(
      filterCalendarEvents(EVENTS, {
        filterType: 'vehicle',
        selectedResourceFilter: 'all',
        sourceFilter: 'offline',
        showReleased: true,
      })
    )

    expect(result).toEqual(['offline-cancelled', 'offline-upcoming'])
  })
})

describe('filterResources', () => {
  const vehicles = [{ id: VEHICLE_ID }, { id: OTHER_VEHICLE_ID }]
  const drivers = [{ id: DRIVER_ID }]

  it('empties the opposite lane list when a resource type is chosen', () => {
    const filters = { filterType: 'vehicle' as const, selectedResourceFilter: 'all' }

    expect(filterResources(vehicles, 'vehicle', filters)).toHaveLength(2)
    expect(filterResources(drivers, 'driver', filters)).toHaveLength(0)
  })

  it('narrows to the single chosen resource', () => {
    const filters = { filterType: 'vehicle' as const, selectedResourceFilter: VEHICLE_ID }

    expect(filterResources(vehicles, 'vehicle', filters)).toEqual([{ id: VEHICLE_ID }])
  })

  it('leaves both lists intact when nothing is chosen', () => {
    expect(filterResources(vehicles, 'vehicle', ALL_OFF)).toHaveLength(2)
    expect(filterResources(drivers, 'driver', ALL_OFF)).toHaveLength(1)
  })
})
