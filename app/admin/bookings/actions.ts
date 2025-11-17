'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUnifiedBookingsList, createBookingAssignment, getUnifiedBookingDetails, type BookingType } from '@/lib/bookings/unified-service'

export interface BookingFilters {
  search?: string
  status?: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  bookingType?: 'all' | 'customer' | 'business'
  vehicleTypeId?: string
  dateFrom?: string
  dateTo?: string
  customerId?: string
  page?: number
  limit?: number
}

export interface BookingWithCustomer {
  id: string
  booking_number: string
  bookingType?: 'customer' | 'business' // Added for unified booking assignment
  customer_id: string
  vehicle_type_id: string
  pickup_datetime: string
  pickup_address: string
  dropoff_address: string
  passenger_count: number
  luggage_count: number
  base_price: number
  amenities_price: number
  total_price: number
  booking_status: string
  payment_status: string
  customer_notes: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  stripe_payment_intent_id: string | null
  paid_at: string | null
  from_location_id?: string
  to_location_id?: string
  from_zone_id?: string
  to_zone_id?: string
  // Nested related data
  customer?: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    avatar_url: string | null
    role: string
    status: string
  } | null
  vehicle_type?: {
    id: string
    name: string
    passenger_capacity: number | null
    luggage_capacity: number | null
    description: string | null
    image_url: string | null
    price_multiplier?: number
  } | null
  from_location?: {
    id: string
    name: string
    type?: string
  } | null
  to_location?: {
    id: string
    name: string
    type?: string
  } | null
  from_zone?: {
    id: string
    name: string
    description?: string | null
  } | null
  to_zone?: {
    id: string
    name: string
    description?: string | null
  } | null
  // Vendor assignment data (array but will have max 1 item due to unique constraint)
  booking_assignments?: Array<{
    id: string
    vendor_id: string
    driver_id: string | null
    vehicle_id: string | null
    status: string
    assigned_at: string
    accepted_at: string | null
    notes: string | null
    vendor: {
      id: string
      business_name: string
      business_phone: string | null
      business_email: string | null
    } | null
    driver?: {
      id: string
      first_name: string
      last_name: string
      phone: string
    } | null
    vehicle?: {
      id: string
      make: string
      model: string
      registration_number: string
    } | null
  }>
}

/**
 * Get all bookings (customer + business) with filters
 * Uses unified service to query both booking types
 */
export async function getBookings(filters: BookingFilters = {}) {
  const {
    search = '',
    status = 'all',
    bookingType = 'all',
    paymentStatus = 'all',
    vehicleTypeId,
    dateFrom,
    dateTo,
    customerId,
    page = 1,
    limit = 10
  } = filters

  // Use unified service to get both customer and business bookings
  const { bookings, totalCount } = await getUnifiedBookingsList({
    search,
    status: status !== 'all' ? status : undefined,
    bookingType: bookingType !== 'all' ? bookingType as 'customer' | 'business' : undefined,
    fromDate: dateFrom,
    toDate: dateTo,
    limit,
    offset: (page - 1) * limit,
  })

  // TODO: Apply payment status and vehicle type filters
  // These need to be added to unified service later
  // For now, we'll return all bookings matching other criteria

  return {
    bookings: bookings as any[], // Type compatibility with existing BookingWithCustomer
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit)
  }
}

/**
 * Get booking details with type detection (works for both customer and business bookings)
 * @param bookingId - ID of the booking
 * @param bookingType - Type of booking ('customer' or 'business')
 */
export async function getBookingDetailsByType(bookingId: string, bookingType: BookingType) {
  return getUnifiedBookingDetails(
    bookingType === 'customer' ? bookingId : undefined,
    bookingType === 'business' ? bookingId : undefined
  )
}

/**
 * Get booking details with automatic type detection (works for both customer and business bookings)
 * Tries customer bookings first, then business bookings if not found
 */
export async function getBookingDetails(bookingId: string) {
  const adminClient = createAdminClient()

  // Try customer booking first
  const { data: customerBooking, error: customerError } = await adminClient
    .from('bookings')
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey(
        id,
        email,
        full_name,
        phone,
        avatar_url,
        role,
        status
      ),
      vehicle_type:vehicle_types(
        id,
        name,
        passenger_capacity,
        luggage_capacity,
        description,
        image_url,
        price_multiplier
      ),
      booking_assignments!left(
        id,
        vendor_id,
        driver_id,
        vehicle_id,
        status,
        assigned_at,
        accepted_at,
        completed_at,
        notes,
        vendor:vendor_applications!left(
          id,
          business_name,
          business_phone,
          business_email
        ),
        driver:vendor_drivers!left(
          id,
          first_name,
          last_name,
          phone,
          license_number
        ),
        vehicle:vehicles!left(
          id,
          make,
          model,
          year,
          registration_number
        )
      )
    `)
    .eq('id', bookingId)
    .single()

  // If customer booking found, process and return it
  if (customerBooking && !customerError) {
    // Get passengers separately
    const { data: passengers } = await adminClient
      .from('booking_passengers')
      .select('*')
      .eq('booking_id', bookingId)
      .order('is_primary', { ascending: false })

    // Get amenities separately
    const { data: amenities } = await adminClient
      .from('booking_amenities')
      .select('*')
      .eq('booking_id', bookingId)

    // Handle booking_assignments - could be null, single object, or array
    let assignments = customerBooking?.booking_assignments;
    if (!assignments) {
      assignments = [];
    } else if (!Array.isArray(assignments)) {
      assignments = [assignments];
    }

    return {
      ...customerBooking,
      bookingType: 'customer' as const,
      booking_assignments: assignments,
      booking_passengers: passengers || [],
      booking_amenities: amenities || []
    }
  }

  // Try business booking
  const { data: businessBooking, error: businessError } = await adminClient
    .from('business_bookings')
    .select(`
      *,
      business_account:business_accounts!business_bookings_business_account_id_fkey(
        id,
        business_name,
        business_email,
        business_phone,
        address,
        city,
        country_code
      ),
      vehicle_type:vehicle_types(
        id,
        name,
        passenger_capacity,
        luggage_capacity,
        description,
        image_url,
        price_multiplier
      )
    `)
    .eq('id', bookingId)
    .single()

  // Separately fetch booking assignments for business bookings
  let businessAssignments: any[] = []
  if (businessBooking) {
    const { data: assignments } = await adminClient
      .from('booking_assignments')
      .select(`
        id,
        vendor_id,
        driver_id,
        vehicle_id,
        status,
        assigned_at,
        accepted_at,
        completed_at,
        notes,
        vendor:vendor_applications!left(
          id,
          business_name,
          business_phone,
          business_email
        ),
        driver:vendor_drivers!left(
          id,
          first_name,
          last_name,
          phone,
          license_number
        ),
        vehicle:vehicles!left(
          id,
          make,
          model,
          year,
          registration_number
        )
      `)
      .eq('business_booking_id', bookingId)

    businessAssignments = assignments || []
  }

  if (businessError || !businessBooking) {
    console.error('Booking not found in either customer or business bookings:', { customerError, businessError })
    throw new Error(`Failed to fetch booking details: Booking not found`)
  }

  return {
    ...businessBooking,
    bookingType: 'business' as const,
    booking_assignments: businessAssignments,
    booking_passengers: [], // Business bookings don't have passengers table
    booking_amenities: [], // Business bookings don't have amenities
    // Map business_account to customer field for compatibility
    customer: businessBooking.business_account ? {
      id: businessBooking.business_account.id,
      email: businessBooking.business_account.business_email,
      full_name: businessBooking.business_account.business_name,
      phone: businessBooking.business_account.business_phone,
      avatar_url: null,
      role: 'business',
      status: 'active'
    } : null
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  cancellationReason?: string
) {
  const adminClient = createAdminClient()

  const updateData: any = {
    booking_status: status,
    updated_at: new Date().toISOString()
  }

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason
    }
  }

  const { error } = await adminClient
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking status:', error)
    throw new Error('Failed to update booking status')
  }

  // Free vehicle and driver resources when booking is completed or cancelled
  if (status === 'completed' || status === 'cancelled') {
    const { data: assignment } = await adminClient
      .from('booking_assignments')
      .select('id')
      .eq('booking_id', bookingId)
      .single()

    if (assignment) {
      // Update assignment status to completed with timestamp
      if (status === 'completed') {
        await adminClient
          .from('booking_assignments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.id)
      }

      const { AvailabilityService } = await import('@/lib/availability/service')
      await AvailabilityService.removeSchedule(assignment.id)
    }
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)

  return { success: true }
}

export async function updatePaymentStatus(
  bookingId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  paymentError?: string
) {
  const adminClient = createAdminClient()
  
  const updateData: any = {
    payment_status: status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'completed') {
    updateData.paid_at = new Date().toISOString()
  }
  
  if (status === 'failed' && paymentError) {
    updateData.payment_error = paymentError
  }
  
  const { error } = await adminClient
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
  
  if (error) {
    console.error('Error updating payment status:', error)
    throw new Error('Failed to update payment status')
  }
  
  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  
  return { success: true }
}

export async function getBookingStats() {
  const adminClient = createAdminClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  // Add timestamp to prevent any caching
  const timestamp = Date.now()

  // Get total bookings - excluding test bookings
  const { count: totalBookings, error: totalError } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('booking_number', 'like', 'TEST-%')

  if (totalError) {
    console.error('Error fetching total bookings:', totalError)
  }

  // Get today's bookings
  const { count: todayBookings, error: todayError } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('booking_number', 'like', 'TEST-%')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString())

  if (todayError) {
    console.error('Error fetching today bookings:', todayError)
  }

  // Get upcoming bookings
  const { count: upcomingBookings, error: upcomingError } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('booking_number', 'like', 'TEST-%')
    .eq('booking_status', 'confirmed')
    .gte('pickup_datetime', now.toISOString())

  if (upcomingError) {
    console.error('Error fetching upcoming bookings:', upcomingError)
  }

  // Get completed bookings
  const { count: completedBookings, error: completedError } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('booking_number', 'like', 'TEST-%')
    .eq('booking_status', 'completed')

  if (completedError) {
    console.error('Error fetching completed bookings:', completedError)
  }

  // Get cancelled bookings
  const { count: cancelledBookings, error: cancelledError } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('booking_number', 'like', 'TEST-%')
    .eq('booking_status', 'cancelled')

  if (cancelledError) {
    console.error('Error fetching cancelled bookings:', cancelledError)
  }

  // Calculate total revenue from completed payments
  const { data: revenueData, error: revenueError } = await adminClient
    .from('bookings')
    .select('total_price')
    .not('booking_number', 'like', 'TEST-%')
    .eq('payment_status', 'completed')

  if (revenueError) {
    console.error('Error fetching revenue data:', revenueError)
  }

  const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

  return {
    total: totalBookings || 0,
    today: todayBookings || 0,
    upcoming: upcomingBookings || 0,
    completed: completedBookings || 0,
    cancelled: cancelledBookings || 0,
    revenue: totalRevenue
  }
}

export async function exportBookingsToCSV(filters: BookingFilters = {}) {
  const { bookings } = await getBookings({ ...filters, limit: 10000 })
  
  const headers = [
    'Booking Number',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Pickup Date',
    'Pickup Time',
    'Pickup Address',
    'Dropoff Address',
    'Vehicle Type',
    'Passengers',
    'Luggage',
    'Base Price',
    'Amenities Price',
    'Total Price',
    'Booking Status',
    'Payment Status',
    'Created At'
  ]
  
  const rows = bookings.map(booking => {
    const pickupDate = new Date(booking.pickup_datetime)
    return [
      booking.booking_number,
      booking.customer?.full_name || '',
      booking.customer?.email || '',
      booking.customer?.phone || '',
      pickupDate.toLocaleDateString(),
      pickupDate.toLocaleTimeString(),
      booking.pickup_address,
      booking.dropoff_address,
      booking.vehicle_type?.name || '',
      booking.passenger_count,
      booking.luggage_count || 0,
      booking.base_price,
      booking.amenities_price || 0,
      booking.total_price,
      booking.booking_status,
      booking.payment_status,
      new Date(booking.created_at).toLocaleString()
    ]
  })
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csv
}

export async function bulkUpdateBookingStatus(
  bookingIds: string[],
  status: 'confirmed' | 'cancelled'
) {
  const adminClient = createAdminClient()
  
  const updateData: any = {
    booking_status: status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancellation_reason = 'Bulk cancellation by admin'
  }
  
  const { error } = await adminClient
    .from('bookings')
    .update(updateData)
    .in('id', bookingIds)
  
  if (error) {
    console.error('Error bulk updating booking status:', error)
    throw new Error('Failed to bulk update booking status')
  }
  
  revalidatePath('/admin/bookings')
  
  return { success: true }
}

export async function getAvailableVendors() {
  const adminClient = createAdminClient()
  
  const { data: vendors, error } = await adminClient
    .from('vendor_applications')
    .select(`
      id,
      business_name,
      business_email,
      business_phone,
      business_city
    `)
    .eq('status', 'approved')
    .order('business_name')
  
  if (error) {
    console.error('Error fetching vendors:', error)
    throw new Error('Failed to fetch vendors')
  }
  
  return vendors || []
}

/**
 * Assign booking to vendor (works for both customer and business bookings)
 * @param bookingId - ID of the booking (customer or business)
 * @param bookingType - Type of booking ('customer' or 'business')
 * @param vendorId - ID of the vendor to assign
 * @param notes - Optional notes for the assignment
 */
export async function assignBookingToVendor(
  bookingId: string,
  bookingType: BookingType,
  vendorId: string,
  notes?: string
) {
  const supabase = await createClient()

  // Get the current user (admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Use unified service to create assignment
  const { data, error } = await createBookingAssignment({
    bookingId: bookingType === 'customer' ? bookingId : undefined,
    businessBookingId: bookingType === 'business' ? bookingId : undefined,
    vendorId,
    assignedBy: user.id,
  })

  if (error) {
    console.error('Error creating booking assignment:', error)
    throw new Error('Failed to assign booking to vendor')
  }
  
  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  
  return { success: true }
}

export async function getBookingAssignment(bookingId: string) {
  const adminClient = createAdminClient()
  
  const { data: assignment, error } = await adminClient
    .from('booking_assignments')
    .select(`
      *,
      vendor:vendor_applications(
        id,
        business_name,
        business_email,
        business_phone
      ),
      driver:vendor_drivers(
        id,
        first_name,
        last_name,
        phone
      ),
      vehicle:vehicles(
        id,
        make,
        model,
        registration_number
      )
    `)
    .eq('booking_id', bookingId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching booking assignment:', error)
    throw new Error('Failed to fetch booking assignment')
  }
  
  return assignment
}