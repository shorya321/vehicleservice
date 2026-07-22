import { format } from 'date-fns'

import { createClient } from '@/lib/supabase/server'
import { toBookingTz } from '@/lib/utils/timezone'

/**
 * Conflict detection for direct bookings, across BOTH booking systems.
 *
 * Where online occupancy actually lives: not in `bookings` or `booking_assignments`
 * but in `resource_schedules` — a polymorphic table (`resource_type` 'vehicle'|'driver',
 * `resource_id`) written at one moment only, when a vendor accepts an online booking
 * and names a driver and vehicle. Customer and B2B bookings both flow through that
 * path, so reading `resource_schedules` covers both at once.
 *
 * Overlap is HALF-OPEN — `existing.start < new.end AND existing.end > new.start` —
 * so a job ending at 16:00 does not collide with one starting at 16:00. This matches
 * `AvailabilityService.findConflicts` and the database exclusion constraints. Do not
 * copy the closed-interval `gte`/`lte` variant in `app/vendor/bookings/actions.ts`;
 * it reports back-to-back trips as conflicts and swallows query errors.
 *
 * This module is the single source of truth. The form, the create path and the update
 * path all call it, so there is exactly one definition of "busy".
 */

import { OCCUPYING_BOOKING_STATUSES } from './schema'

export type ConflictSource = 'online' | 'unavailability' | 'direct'

export interface ResourceConflict {
  source: ConflictSource
  label: string
  start: string
  end: string
}

export interface ResourceConflicts {
  vehicle: ResourceConflict[]
  driver: ResourceConflict[]
}

interface BusyWindow {
  resourceId: string
  source: ConflictSource
  start: string
  end: string
  detail?: string | null
}

function formatWindow(start: string, end: string): string {
  const s = toBookingTz(start)
  const e = toBookingTz(end)
  const sameDay = format(s, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd')

  return sameDay
    ? `${format(s, 'dd MMM')} ${format(s, 'HH:mm')}–${format(e, 'HH:mm')}`
    : `${format(s, 'dd MMM HH:mm')} – ${format(e, 'dd MMM HH:mm')}`
}

function describe(window: BusyWindow): string {
  const when = formatWindow(window.start, window.end)

  switch (window.source) {
    case 'online':
      return `online booking, ${when}`
    case 'direct':
      return `direct booking${window.detail ? ` ${window.detail}` : ''}, ${when}`
    case 'unavailability':
      return `marked unavailable${window.detail ? ` (${window.detail})` : ''}, ${when}`
  }
}

/**
 * Every busy window touching [start, end) for the given resources, from all three
 * sources, in one round trip per source.
 *
 * `resourceIds` covers vehicles and drivers together — `resource_id` in the schedule
 * tables is an untyped uuid, and uuids do not collide across tables, so a single
 * `.in()` is safe and saves a query.
 *
 * Errors throw. A failed query must never be silently read as "available", nor as
 * "unavailable" — the latter is a live bug in the online flow, where a dropped
 * `error` makes `schedules?.length === 0` evaluate `undefined === 0` and every
 * resource shows as busy the moment the database hiccups.
 */
async function loadBusyWindows(
  vendorId: string,
  resourceIds: string[],
  start: Date,
  end: Date,
  excludeDirectBookingId?: string
): Promise<BusyWindow[]> {
  if (resourceIds.length === 0) return []

  const supabase = await createClient()
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  // Chained filters are ANDed: existing.start < new.end AND existing.end > new.start.
  const schedulesQuery = supabase
    .from('resource_schedules')
    .select('resource_id, start_datetime, end_datetime')
    .in('resource_id', resourceIds)
    .lt('start_datetime', endIso)
    .gt('end_datetime', startIso)

  const unavailabilityQuery = supabase
    .from('resource_unavailability')
    .select('resource_id, start_datetime, end_datetime, reason')
    .in('resource_id', resourceIds)
    .lt('start_datetime', endIso)
    .gt('end_datetime', startIso)

  let directQuery = supabase
    .from('vendor_direct_bookings')
    .select('id, reference_number, vehicle_id, driver_id, pickup_datetime, return_datetime')
    .eq('vendor_id', vendorId)
    .in('booking_status', [...OCCUPYING_BOOKING_STATUSES])
    .lt('pickup_datetime', endIso)
    .gt('return_datetime', startIso)

  if (excludeDirectBookingId) {
    directQuery = directQuery.neq('id', excludeDirectBookingId)
  }

  const [schedules, unavailability, direct] = await Promise.all([
    schedulesQuery,
    unavailabilityQuery,
    directQuery,
  ])

  if (schedules.error) {
    console.error('Error loading resource schedules:', schedules.error)
    throw new Error('Could not check availability. Please try again.')
  }
  if (unavailability.error) {
    console.error('Error loading resource unavailability:', unavailability.error)
    throw new Error('Could not check availability. Please try again.')
  }
  if (direct.error) {
    console.error('Error loading direct bookings:', direct.error)
    throw new Error('Could not check availability. Please try again.')
  }

  const windows: BusyWindow[] = []

  for (const row of schedules.data ?? []) {
    windows.push({
      resourceId: row.resource_id,
      source: 'online',
      start: row.start_datetime,
      end: row.end_datetime,
    })
  }

  for (const row of unavailability.data ?? []) {
    windows.push({
      resourceId: row.resource_id,
      source: 'unavailability',
      start: row.start_datetime,
      end: row.end_datetime,
      detail: row.reason,
    })
  }

  // A direct booking occupies its vehicle AND its driver, so it yields two windows.
  for (const row of direct.data ?? []) {
    const shared = {
      source: 'direct' as const,
      start: row.pickup_datetime,
      end: row.return_datetime,
      detail: row.reference_number,
    }
    windows.push({ ...shared, resourceId: row.vehicle_id })
    windows.push({ ...shared, resourceId: row.driver_id })
  }

  return windows.filter((w) => resourceIds.includes(w.resourceId))
}

/**
 * Conflicts for one specific vehicle + driver pair. Used by the create and update
 * paths to produce a message naming what is blocking.
 */
export async function findResourceConflicts(params: {
  vendorId: string
  vehicleId: string
  driverId: string
  start: Date
  end: Date
  excludeDirectBookingId?: string
}): Promise<ResourceConflicts> {
  const { vendorId, vehicleId, driverId, start, end, excludeDirectBookingId } = params

  const windows = await loadBusyWindows(
    vendorId,
    [vehicleId, driverId],
    start,
    end,
    excludeDirectBookingId
  )

  const toConflict = (w: BusyWindow): ResourceConflict => ({
    source: w.source,
    label: describe(w),
    start: w.start,
    end: w.end,
  })

  return {
    vehicle: windows.filter((w) => w.resourceId === vehicleId).map(toConflict),
    driver: windows.filter((w) => w.resourceId === driverId).map(toConflict),
  }
}

export interface FleetOption {
  id: string
  label: string
  available: boolean
  reason: string | null
}

export interface FleetAvailability {
  vehicles: FleetOption[]
  drivers: FleetOption[]
}

/**
 * Availability for the vendor's whole fleet over one window, for the form's selects.
 *
 * Batched: three queries total regardless of fleet size. The online flow's
 * equivalent runs two queries per resource, which is what makes it slow.
 *
 * Vehicles flagged unavailable and drivers flagged inactive are reported as
 * unavailable regardless of time.
 */
export async function getFleetAvailability(
  vendorId: string,
  start: Date,
  end: Date,
  excludeDirectBookingId?: string
): Promise<FleetAvailability> {
  const supabase = await createClient()

  const [vehiclesResult, driversResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, make, model, year, registration_number, is_available')
      .eq('business_id', vendorId)
      .order('make', { ascending: true }),
    supabase
      .from('vendor_drivers')
      .select('id, first_name, last_name, phone, is_active')
      .eq('vendor_id', vendorId)
      .order('first_name', { ascending: true }),
  ])

  if (vehiclesResult.error) {
    console.error('Error loading vehicles:', vehiclesResult.error)
    throw new Error('Could not load your vehicles. Please try again.')
  }
  if (driversResult.error) {
    console.error('Error loading drivers:', driversResult.error)
    throw new Error('Could not load your drivers. Please try again.')
  }

  const vehicles = vehiclesResult.data ?? []
  const drivers = driversResult.data ?? []

  const windows = await loadBusyWindows(
    vendorId,
    [...vehicles.map((v) => v.id), ...drivers.map((d) => d.id)],
    start,
    end,
    excludeDirectBookingId
  )

  const busyBy = new Map<string, BusyWindow>()
  for (const window of windows) {
    // Keep the earliest conflict — it is the most useful one to name.
    const existing = busyBy.get(window.resourceId)
    if (!existing || window.start < existing.start) {
      busyBy.set(window.resourceId, window)
    }
  }

  return {
    vehicles: vehicles.map((vehicle) => {
      const busy = busyBy.get(vehicle.id)
      const label = `${vehicle.make} ${vehicle.model}${
        vehicle.year ? ` (${vehicle.year})` : ''
      } — ${vehicle.registration_number}`

      if (vehicle.is_available === false) {
        return { id: vehicle.id, label, available: false, reason: 'marked out of service' }
      }

      return {
        id: vehicle.id,
        label,
        available: !busy,
        reason: busy ? describe(busy) : null,
      }
    }),

    drivers: drivers.map((driver) => {
      const busy = busyBy.get(driver.id)
      const label = `${driver.first_name} ${driver.last_name} — ${driver.phone}`

      if (driver.is_active === false) {
        return { id: driver.id, label, available: false, reason: 'inactive' }
      }

      return {
        id: driver.id,
        label,
        available: !busy,
        reason: busy ? describe(busy) : null,
      }
    }),
  }
}

/**
 * True when a Postgres error is one of our overlap rejections.
 *
 * Both the EXCLUDE constraints and the cross-table trigger raise 23P01, so the
 * application maps one code to one message. This is the backstop that catches a
 * conflict created between the check and the write.
 */
export function isOverlapError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23P01'
  )
}
