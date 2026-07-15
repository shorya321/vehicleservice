import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import type { Database } from '@/lib/supabase/types'

export interface AvailabilitySlot {
  start: Date
  end: Date
  available: boolean
  reason?: string
  bookingId?: string
}

/**
 * Derived from the generated Supabase row types rather than hand-written, so
 * column nullability cannot drift out of sync with the database.
 */
export type ResourceSchedule = Database['public']['Tables']['resource_schedules']['Row'] & {
  booking?: {
    booking_number: string
    pickup_address: string
    dropoff_address: string
  }
}

export type ResourceUnavailability = Database['public']['Tables']['resource_unavailability']['Row']

/**
 * A booking occupies a resource from pickup for this fixed estimate. Schedules are
 * created at pickup → pickup + this (see bookings/actions.ts), so past events must
 * be rendered at the same length they were originally booked at, or history would
 * not line up with the blocks that once occupied the calendar.
 */
export const ESTIMATED_TRIP_DURATION_MS = 2 * 60 * 60 * 1000

/**
 * A past booking sourced from booking_assignments (the permanent record), joined to
 * its booking / business_booking / vehicle / driver. Shaped to match the inline
 * select in availability/actions.ts so the same event-mapping helper consumes both
 * this and live schedules. Embedded relations come back as objects (single FK).
 */
export interface PastBookingAssignment {
  id: string
  status: string
  booking: {
    booking_number: string | null
    trip_number: string | null
    pickup_address: string | null
    dropoff_address: string | null
    pickup_datetime: string | null
    customer: { full_name: string | null; phone: string | null } | null
  } | null
  business_booking: {
    booking_number: string | null
    trip_number: string | null
    pickup_address: string | null
    dropoff_address: string | null
    pickup_datetime: string | null
    customer_name: string | null
    customer_phone: string | null
    from_location: { name: string | null } | null
    to_location: { name: string | null } | null
  } | null
  vehicle: {
    id: string
    make: string | null
    model: string | null
    registration_number: string | null
  } | null
  driver: {
    id: string
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

/** Why a resource is not free for a period. The two kinds are reported separately
 *  so callers can tell the vendor the truth about which one blocked them. */
export interface AvailabilityConflicts {
  schedules: ResourceSchedule[]
  unavailability: ResourceUnavailability[]
}

export class AvailabilityService {
  /**
   * Everything that overlaps [startTime, endTime) for a resource, split by kind.
   *
   * Throws on query failure rather than reporting "no conflicts" or "conflicted".
   * A database outage is not an availability answer, and callers that coerce it
   * into one tell the vendor something untrue.
   *
   * Scoping note: this filters on resource_id only. It is called through the RLS
   * client, whose policies confine the rows to the caller's own vendor. Do not
   * switch it to the admin client without adding an explicit vendor_id filter.
   */
  static async findConflicts(
    resourceId: string,
    resourceType: 'vehicle' | 'driver',
    startTime: Date,
    endTime: Date
  ): Promise<AvailabilityConflicts> {
    const supabase = await createClient()

    // Half-open overlap: touching at the boundary is not a conflict.
    const overlaps = `and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`

    const [scheduleResult, unavailabilityResult] = await Promise.all([
      supabase
        .from('resource_schedules')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType)
        .or(overlaps),
      supabase
        .from('resource_unavailability')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType)
        .or(overlaps),
    ])

    if (scheduleResult.error) {
      console.error('Error checking schedules:', scheduleResult.error)
      throw new Error('Could not check resource availability. Please try again.')
    }

    if (unavailabilityResult.error) {
      console.error('Error checking unavailability:', unavailabilityResult.error)
      throw new Error('Could not check resource availability. Please try again.')
    }

    return {
      schedules: scheduleResult.data ?? [],
      unavailability: unavailabilityResult.data ?? [],
    }
  }

  /**
   * Check if a resource is available for a given time period.
   * Throws if availability could not be determined.
   */
  static async checkAvailability(
    resourceId: string,
    resourceType: 'vehicle' | 'driver',
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const conflicts = await this.findConflicts(resourceId, resourceType, startTime, endTime)

    return conflicts.schedules.length === 0 && conflicts.unavailability.length === 0
  }

  /**
   * Get all schedules for a vendor's resources
   */
  static async getVendorSchedules(
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ResourceSchedule[]> {
    const adminClient = createAdminClient()

    let query = adminClient
      .from('resource_schedules')
      .select(`
        *,
        booking_assignment:booking_assignments!booking_assignment_id(
          booking:bookings(
            booking_number,
            pickup_address,
            dropoff_address,
            pickup_datetime
          )
        )
      `)
      .eq('vendor_id', vendorId)
      .order('start_datetime', { ascending: true })

    // An event overlaps the range if it starts on/before the range ends AND ends
    // on/after the range starts.
    //
    // Bookings stay clamped to today-and-future on purpose. Schedule rows are
    // hard-deleted the moment a booking completes or is cancelled (removeSchedule),
    // so this table holds current occupancy, not history — a past window would be
    // populated only by rows that were never cleaned up. Past trips live in
    // booking_assignments, surfaced by the Bookings History page.
    const today = startOfBookingDayUtc()

    if (startDate && endDate) {
      // Never look further back than today, whatever range was asked for.
      const effectiveStartDate = startDate < today ? today : startDate
      query = query
        .lte('start_datetime', endDate.toISOString())
        .gte('end_datetime', effectiveStartDate.toISOString())
    } else if (startDate) {
      const effectiveStartDate = startDate < today ? today : startDate
      query = query.gte('end_datetime', effectiveStartDate.toISOString())
    } else if (endDate) {
      query = query
        .lte('start_datetime', endDate.toISOString())
        .gte('end_datetime', today.toISOString())
    } else {
      query = query.gte('end_datetime', today.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching vendor schedules:', error)
      throw new Error('Failed to fetch schedules')
    }

    return data || []
  }

  /**
   * Get unavailability periods for a vendor's resources
   */
  static async getVendorUnavailability(
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ResourceUnavailability[]> {
    const supabase = await createClient()

    let query = supabase
      .from('resource_unavailability')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('start_datetime', { ascending: true })

    // An explicit range is honoured verbatim, past included. Unlike schedules,
    // unavailability rows are never deleted, so history here is real: past
    // maintenance windows and driver leave are recorded nowhere else in the
    // product, and hiding them lost the only copy.
    //
    // The floor below applies only when no startDate was given — those calls are
    // unbounded backwards and would otherwise scan the vendor's whole history.
    if (startDate && endDate) {
      query = query
        .lte('start_datetime', endDate.toISOString())
        .gte('end_datetime', startDate.toISOString())
    } else if (startDate) {
      query = query.gte('end_datetime', startDate.toISOString())
    } else if (endDate) {
      query = query
        .lte('start_datetime', endDate.toISOString())
        .gte('end_datetime', startOfBookingDayUtc().toISOString())
    } else {
      query = query.gte('end_datetime', startOfBookingDayUtc().toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching unavailability:', error)
      throw new Error('Failed to fetch unavailability periods')
    }

    return data || []
  }

  /**
   * Past bookings for a vendor's resources, sourced from booking_assignments — the
   * only permanent record of a trip once it is over. resource_schedules rows are
   * hard-deleted on completion/cancellation (removeSchedule), so getVendorSchedules
   * can never surface history; this method fills the gap for the calendar.
   *
   * All assignment statuses are returned (completed, accepted, cancelled, rejected,
   * pending) so the calendar can colour-code what actually ran vs. what fell through.
   *
   * pickup_datetime lives in bookings OR business_bookings, and PostgREST can only
   * range-filter a joined column through an inner join — one query can inner-join
   * one source — so two queries run and are unioned. Kept range-scoped (never the
   * whole history) for the same reason getVendorSchedules clamps.
   *
   * Admin client is used with an explicit vendor_id filter (see the scoping note on
   * findConflicts). Only assignments whose estimated end is strictly before today
   * are returned, so there is zero overlap with live schedules (end >= today).
   */
  static async getVendorPastBookings(
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PastBookingAssignment[]> {
    const adminClient = createAdminClient()

    const today = startOfBookingDayUtc()
    // Never fetch pickups at/after today — that window belongs to live schedules.
    const upperBound = endDate && endDate < today ? endDate : today
    // The calendar always passes a range, so startDate is normally present; the
    // fallback floor stops an unbounded call from scanning the vendor's whole past.
    const lowerBound = startDate ?? new Date(upperBound.getTime() - 32 * 24 * 60 * 60 * 1000)

    const customerSelect = `
      id,
      status,
      booking:bookings!inner(
        booking_number,
        trip_number,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        customer:profiles(full_name, phone)
      ),
      vehicle:vehicles(id, make, model, registration_number),
      driver:vendor_drivers(id, first_name, last_name, phone)
    `

    const businessSelect = `
      id,
      status,
      business_booking:business_bookings!inner(
        booking_number,
        trip_number,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        customer_name,
        customer_phone,
        from_location:locations!from_location_id(name),
        to_location:locations!to_location_id(name)
      ),
      vehicle:vehicles(id, make, model, registration_number),
      driver:vendor_drivers(id, first_name, last_name, phone)
    `

    const [customerResult, businessResult] = await Promise.all([
      adminClient
        .from('booking_assignments')
        .select(customerSelect)
        .eq('vendor_id', vendorId)
        .gte('booking.pickup_datetime', lowerBound.toISOString())
        .lt('booking.pickup_datetime', upperBound.toISOString()),
      adminClient
        .from('booking_assignments')
        .select(businessSelect)
        .eq('vendor_id', vendorId)
        .gte('business_booking.pickup_datetime', lowerBound.toISOString())
        .lt('business_booking.pickup_datetime', upperBound.toISOString()),
    ])

    if (customerResult.error) {
      console.error('Error fetching past customer bookings:', customerResult.error)
      throw new Error('Failed to fetch past bookings')
    }

    if (businessResult.error) {
      console.error('Error fetching past business bookings:', businessResult.error)
      throw new Error('Failed to fetch past bookings')
    }

    // Boundary cast: PostgREST types embedded relations loosely; the select shape
    // matches PastBookingAssignment by construction.
    const rows = [
      ...(customerResult.data ?? []),
      ...(businessResult.data ?? []),
    ] as unknown as PastBookingAssignment[]

    // Keep only trips whose estimated end is before today — the exact line that
    // prevents overlap with live schedules, and dedupe by assignment id.
    const seen = new Set<string>()
    const past: PastBookingAssignment[] = []

    for (const row of rows) {
      if (seen.has(row.id)) continue
      const pickup = row.booking?.pickup_datetime ?? row.business_booking?.pickup_datetime
      if (!pickup) continue
      const end = new Date(new Date(pickup).getTime() + ESTIMATED_TRIP_DURATION_MS)
      if (end >= today) continue
      seen.add(row.id)
      past.push(row)
    }

    return past
  }

  /**
   * Mark a resource as unavailable for a period
   */
  static async markUnavailable(
    resourceId: string,
    resourceType: 'vehicle' | 'driver',
    vendorId: string,
    startTime: Date,
    endTime: Date,
    reason: string,
    notes?: string
  ): Promise<boolean> {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('resource_unavailability')
      .insert({
        vendor_id: vendorId,
        resource_type: resourceType,
        resource_id: resourceId,
        start_datetime: startTime.toISOString(),
        end_datetime: endTime.toISOString(),
        reason,
        notes,
        created_by: user.id
      })

    if (error) {
      console.error('Error marking resource unavailable:', error)
      return false
    }

    return true
  }

  /**
   * Create a schedule entry when a booking is accepted
   */
  static async createSchedule(
    assignmentId: string,
    vendorId: string,
    vehicleId: string,
    driverId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const adminClient = createAdminClient()

    // Create schedules for both vehicle and driver
    const schedules = [
      {
        vendor_id: vendorId,
        resource_type: 'vehicle' as const,
        resource_id: vehicleId,
        booking_assignment_id: assignmentId,
        start_datetime: startTime.toISOString(),
        end_datetime: endTime.toISOString(),
        status: 'booked'
      },
      {
        vendor_id: vendorId,
        resource_type: 'driver' as const,
        resource_id: driverId,
        booking_assignment_id: assignmentId,
        start_datetime: startTime.toISOString(),
        end_datetime: endTime.toISOString(),
        status: 'booked'
      }
    ]

    const { error } = await adminClient
      .from('resource_schedules')
      .insert(schedules)

    if (error) {
      console.error('Error creating schedules:', error)
      return false
    }

    return true
  }

  /**
   * Remove schedule entries when a booking is cancelled
   */
  static async removeSchedule(assignmentId: string): Promise<boolean> {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('resource_schedules')
      .delete()
      .eq('booking_assignment_id', assignmentId)

    if (error) {
      console.error('Error removing schedules:', error)
      return false
    }

    return true
  }

  /**
   * Get available resources for a time period
   */
  static async getAvailableResources(
    vendorId: string,
    resourceType: 'vehicle' | 'driver',
    startTime: Date,
    endTime: Date
  ): Promise<string[]> {
    const supabase = await createClient()

    // Get all resources
    let allResources: any[] = []

    if (resourceType === 'vehicle') {
      const { data } = await supabase
        .from('vehicles')
        .select('id')
        .eq('business_id', vendorId)
        .eq('is_available', true)
      allResources = data || []
    } else {
      const { data } = await supabase
        .from('vendor_drivers')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('is_available', true)
        .eq('is_active', true)
      allResources = data || []
    }

    // Check availability for each resource
    const availableResources: string[] = []

    for (const resource of allResources) {
      const isAvailable = await this.checkAvailability(
        resource.id,
        resourceType,
        startTime,
        endTime
      )

      if (isAvailable) {
        availableResources.push(resource.id)
      }
    }

    return availableResources
  }

  /**
   * Get conflicts for a resource in a time period, flattened into one list.
   */
  static async getConflicts(
    resourceId: string,
    resourceType: 'vehicle' | 'driver',
    startTime: Date,
    endTime: Date
  ): Promise<Array<ResourceSchedule | ResourceUnavailability>> {
    const { schedules, unavailability } = await this.findConflicts(
      resourceId,
      resourceType,
      startTime,
      endTime
    )

    return [...schedules, ...unavailability]
  }
}