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