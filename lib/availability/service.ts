import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AvailabilitySlot {
  start: Date
  end: Date
  available: boolean
  reason?: string
  bookingId?: string
}

export interface ResourceSchedule {
  id: string
  vendor_id: string
  resource_type: 'vehicle' | 'driver'
  resource_id: string
  booking_assignment_id?: string
  start_datetime: string
  end_datetime: string
  status: string
  booking?: {
    booking_number: string
    pickup_address: string
    dropoff_address: string
  }
}

export interface ResourceUnavailability {
  id: string
  vendor_id: string
  resource_type: 'vehicle' | 'driver'
  resource_id: string
  reason: string
  start_datetime: string
  end_datetime: string
  notes?: string
}

export class AvailabilityService {
  /**
   * Check if a resource is available for a given time period
   */
  static async checkAvailability(
    resourceId: string,
    resourceType: 'vehicle' | 'driver',
    startTime: Date,
    endTime: Date,
    vendorId?: string
  ): Promise<boolean> {
    const supabase = await createClient()

    // Check for existing schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('resource_schedules')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .or(`and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`)

    if (scheduleError) {
      console.error('Error checking schedules:', scheduleError)
      return false
    }

    // Check for unavailability periods
    const { data: unavailability, error: unavailError } = await supabase
      .from('resource_unavailability')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .or(`and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`)

    if (unavailError) {
      console.error('Error checking unavailability:', unavailError)
      return false
    }

    // Resource is available if no conflicts found
    return (!schedules || schedules.length === 0) && (!unavailability || unavailability.length === 0)
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

    if (startDate) {
      query = query.gte('start_datetime', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('end_datetime', endDate.toISOString())
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

    if (startDate) {
      query = query.gte('start_datetime', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('end_datetime', endDate.toISOString())
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
        endTime,
        vendorId
      )

      if (isAvailable) {
        availableResources.push(resource.id)
      }
    }

    return availableResources
  }

  /**
   * Get conflicts for a resource in a time period
   */
  static async getConflicts(
    resourceId: string,
    resourceType: 'vehicle' | 'driver',
    startTime: Date,
    endTime: Date
  ): Promise<Array<ResourceSchedule | ResourceUnavailability>> {
    const supabase = await createClient()

    // Get schedule conflicts
    const { data: schedules } = await supabase
      .from('resource_schedules')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .or(`and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`)

    // Get unavailability conflicts
    const { data: unavailability } = await supabase
      .from('resource_unavailability')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .or(`and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`)

    return [...(schedules || []), ...(unavailability || [])]
  }
}