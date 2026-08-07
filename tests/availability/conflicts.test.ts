import { conflictsByResource, findResourceConflicts } from '@/lib/availability/conflicts'
import type { CalendarEvent } from '@/app/vendor/availability/types'

/**
 * Double-booking detection.
 *
 * The rule that matters is which events count: only ones that actually hold the
 * resource. A pending offer reserves nothing until the vendor accepts it, and a
 * completed or cancelled booking has released its vehicle and driver. Flagging
 * either would teach the vendor to ignore the warning, which costs more than
 * showing nothing at all.
 */

const VEHICLE = { id: 'veh-1', label: 'Camry', kind: 'vehicle' as const }
const DRIVER = { id: 'drv-1', label: 'Rahul', kind: 'driver' as const }
const FLEET = [VEHICLE, DRIVER]

function dubai(time: string): Date {
  return new Date(`2026-08-10T${time}:00+04:00`)
}

function booking(id: string, from: string, to: string, overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id,
    title: id,
    start: dubai(from),
    end: dubai(to),
    resourceId: id,
    resourceType: 'booking',
    type: 'booking',
    vehicleId: VEHICLE.id,
    driverId: DRIVER.id,
    source: 'offline',
    occupies: true,
    status: 'confirmed',
    ...overrides,
  }
}

describe('findResourceConflicts', () => {
  it('flags two occupying jobs that overlap on the same vehicle', () => {
    const conflicts = findResourceConflicts(
      [booking('a', '09:00', '13:00'), booking('b', '12:00', '15:00')],
      [VEHICLE]
    )

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].resourceLabel).toBe('Camry')
    expect(conflicts[0].events.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('reports the same clash once per resource it affects', () => {
    // Both jobs name the same vehicle AND the same driver, so the fleet is
    // double booked twice over and the vendor needs to see both rows.
    const conflicts = findResourceConflicts(
      [booking('a', '09:00', '13:00'), booking('b', '12:00', '15:00')],
      FLEET
    )

    expect(conflicts.map((c) => c.resourceKind)).toEqual(['vehicle', 'driver'])
  })

  it('treats back-to-back trips as fine, matching the database range type', () => {
    const conflicts = findResourceConflicts(
      [booking('a', '09:00', '12:00'), booking('b', '12:00', '15:00')],
      FLEET
    )

    expect(conflicts).toHaveLength(0)
  })

  it('does not flag a pending offer, which reserves nothing', () => {
    const conflicts = findResourceConflicts(
      [
        booking('accepted', '09:00', '13:00'),
        booking('offer', '10:00', '14:00', { occupies: false, status: 'pending' }),
      ],
      FLEET
    )

    expect(conflicts).toHaveLength(0)
  })

  it('does not flag a completed booking, which has released its resources', () => {
    const conflicts = findResourceConflicts(
      [
        booking('live', '09:00', '13:00'),
        booking('done', '10:00', '14:00', { occupies: false, status: 'completed' }),
      ],
      FLEET
    )

    expect(conflicts).toHaveLength(0)
  })

  it('flags a maintenance block sitting on top of a live booking', () => {
    const block: CalendarEvent = {
      id: 'block',
      title: 'Camry - maintenance',
      start: dubai('11:00'),
      end: dubai('18:00'),
      resourceId: VEHICLE.id,
      resourceType: 'vehicle',
      type: 'unavailable',
      vehicleId: null,
      driverId: null,
      source: 'blocked',
      occupies: true,
    }

    const conflicts = findResourceConflicts([booking('a', '09:00', '13:00'), block], [VEHICLE])

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].events.map((e) => e.id)).toEqual(['a', 'block'])
  })

  it('ignores a resource that is not in the visible fleet', () => {
    const conflicts = findResourceConflicts(
      [booking('a', '09:00', '13:00'), booking('b', '12:00', '15:00')],
      [{ id: 'veh-other', label: 'Hiace', kind: 'vehicle' }]
    )

    expect(conflicts).toHaveLength(0)
  })

  it('finds every pair when three jobs pile up on one resource', () => {
    const conflicts = findResourceConflicts(
      [booking('a', '09:00', '15:00'), booking('b', '10:00', '12:00'), booking('c', '11:00', '13:00')],
      [VEHICLE]
    )

    expect(conflicts.map((c) => c.events.map((e) => e.id).join('-'))).toEqual(['a-b', 'a-c', 'b-c'])
  })
})

describe('conflictsByResource', () => {
  it('collects both sides of every conflict under the resource they clash on', () => {
    const conflicts = findResourceConflicts(
      [booking('a', '09:00', '13:00'), booking('b', '12:00', '15:00')],
      FLEET
    )
    const byResource = conflictsByResource(conflicts)

    expect(Array.from(byResource.get(VEHICLE.id) ?? []).sort()).toEqual(['a', 'b'])
    expect(Array.from(byResource.get(DRIVER.id) ?? []).sort()).toEqual(['a', 'b'])
  })

  it('leaves the driver clean when only the vehicle is double booked', () => {
    // A maintenance block on the vehicle clashes with the trip, but the driver is
    // free to take it. Flagging their lane too would report a problem the vendor
    // cannot find, which is what a flat set of event ids used to do.
    const block: CalendarEvent = {
      id: 'block',
      title: 'Camry - maintenance',
      start: dubai('11:00'),
      end: dubai('18:00'),
      resourceId: VEHICLE.id,
      resourceType: 'vehicle',
      type: 'unavailable',
      vehicleId: null,
      driverId: null,
      source: 'blocked',
      occupies: true,
    }

    const byResource = conflictsByResource(
      findResourceConflicts([booking('a', '09:00', '13:00'), block], FLEET)
    )

    expect(Array.from(byResource.get(VEHICLE.id) ?? []).sort()).toEqual(['a', 'block'])
    expect(byResource.has(DRIVER.id)).toBe(false)
  })

  it('is empty when nothing clashes', () => {
    expect(conflictsByResource([]).size).toBe(0)
  })
})
