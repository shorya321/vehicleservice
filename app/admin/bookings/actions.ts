'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUnifiedBookingsList, createBookingAssignment, getUnifiedBookingDetails, type BookingType } from '@/lib/bookings/unified-service'
import { sendBookingAssignmentEmail, sendBookingUnassignmentEmail } from '@/lib/email/services/vendor-emails'
import { sendDriverBookingUnassignmentEmail } from '@/lib/email/services/driver-emails'
import {
  sendBusinessCustomerBookingCancelledEmail,
  sendBusinessBookingStatusUpdateEmail,
  sendBusinessBookingCancellationEmail,
} from '@/lib/email/services/business-emails'
import { getAppUrl } from '@/lib/email/config'
import { format, parseISO } from 'date-fns'

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
  trip_number: string
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
        cancelled_at,
        cancellation_reason,
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

    // Get amenities separately with addon details
    const { data: amenities } = await adminClient
      .from('booking_amenities')
      .select(`
        *,
        addon:addons (
          id,
          name,
          icon
        )
      `)
      .eq('booking_id', bookingId)

    // Handle booking_assignments - could be null, single object, or array
    let assignments = customerBooking?.booking_assignments;
    if (!assignments) {
      assignments = [];
    } else if (!Array.isArray(assignments)) {
      assignments = [assignments];
    }

    const activeStatuses = ['pending', 'accepted', 'completed']
    assignments.sort((a: any, b: any) => {
      const aActive = activeStatuses.includes(a.status) ? 0 : 1
      const bActive = activeStatuses.includes(b.status) ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    })

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
        cancelled_at,
        cancellation_reason,
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
      .order('assigned_at', { ascending: false })

    businessAssignments = assignments || []
    const activeStatuses = ['pending', 'accepted', 'completed']
    businessAssignments.sort((a: any, b: any) => {
      const aActive = activeStatuses.includes(a.status) ? 0 : 1
      const bActive = activeStatuses.includes(b.status) ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    })
  }

  // Fetch business booking addons
  let businessAddons: any[] = []
  if (businessBooking) {
    const { data: addons } = await adminClient
      .from('business_booking_addons')
      .select(`
        id,
        quantity,
        unit_price,
        total_price,
        addon:addon_id(id, name, category, icon, description)
      `)
      .eq('business_booking_id', bookingId)

    businessAddons = addons || []
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
    booking_amenities: businessAddons.map(addon => ({
      id: addon.id,
      amenity_type: 'addon',
      quantity: addon.quantity,
      price: addon.total_price,
      addon: addon.addon,
    })),
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
  bookingType: 'customer' | 'business',
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

  // Select correct table based on booking type
  const tableName = bookingType === 'customer' ? 'bookings' : 'business_bookings'
  const { error } = await adminClient
    .from(tableName)
    .update(updateData)
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking status:', error)
    throw new Error('Failed to update booking status')
  }

  // Free vehicle and driver resources when booking is completed or cancelled
  if (status === 'completed' || status === 'cancelled') {
    // Use correct field based on booking type
    const fieldName = bookingType === 'customer' ? 'booking_id' : 'business_booking_id'
    const { data: assignment } = await adminClient
      .from('booking_assignments')
      .select('id, driver_id, vendor_id')
      .eq(fieldName, bookingId)
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

      // Notify driver of booking cancellation (non-blocking)
      if (status === 'cancelled' && assignment.driver_id) {
        try {
          const { data: driver } = await adminClient
            .from('vendor_drivers')
            .select('first_name, last_name, email')
            .eq('id', assignment.driver_id)
            .single()

          if (driver?.email) {
            const { data: vendorForDriver } = await adminClient
              .from('vendor_applications')
              .select('business_name')
              .eq('id', assignment.vendor_id)
              .single()

            const cancelBookingDetails = await getBookingDetailsForEmail(bookingId, bookingType)
            if (cancelBookingDetails) {
              await sendDriverBookingUnassignmentEmail({
                driverName: `${driver.first_name} ${driver.last_name}`,
                driverEmail: driver.email,
                bookingReference: cancelBookingDetails.bookingNumber,
                tripNumber: cancelBookingDetails.tripNumber || undefined,
                customerName: cancelBookingDetails.customerName,
                pickupLocation: cancelBookingDetails.pickupAddress,
                pickupDate: cancelBookingDetails.pickupDate,
                pickupTime: cancelBookingDetails.pickupTime,
                reason: cancellationReason || 'Booking cancelled',
                vendorName: vendorForDriver?.business_name || 'Your Company',
              })
            }
          }
        } catch (driverCancelEmailError) {
          console.error('Failed to send driver cancellation email (non-critical):', driverCancelEmailError)
        }
      }
    }
  }

  // Send email notifications for business bookings
  if (bookingType === 'business') {
    try {
      const emailDetails = await getBusinessBookingEmailDetails(bookingId)
      if (emailDetails) {
        if (status === 'cancelled') {
          // Send customer cancellation email
          if (emailDetails.customerEmail) {
            sendBusinessCustomerBookingCancelledEmail({
              customerName: emailDetails.customerName,
              customerEmail: emailDetails.customerEmail,
              businessName: emailDetails.businessName,
              bookingNumber: emailDetails.bookingNumber,
              tripNumber: emailDetails.tripNumber,
              pickupLocation: emailDetails.pickupLocation,
              dropoffLocation: emailDetails.dropoffLocation,
              pickupDateTime: emailDetails.pickupDateTime,
              cancellationReason,
            }).catch((err: unknown) => console.error('Failed to send customer cancel email:', err))
          }

          // Send business cancellation email
          if (emailDetails.businessEmail) {
            sendBusinessBookingCancellationEmail({
              email: emailDetails.businessEmail,
              businessName: emailDetails.businessName,
              bookingNumber: emailDetails.bookingNumber,
              tripNumber: emailDetails.tripNumber,
              customerName: emailDetails.customerName,
              pickupLocation: emailDetails.pickupLocation,
              dropoffLocation: emailDetails.dropoffLocation,
              pickupDateTime: emailDetails.pickupDateTime,
              cancellationReason,
              refundAmount: 0,
              newBalance: 0,
              currency: emailDetails.currency,
              walletUrl: `${getAppUrl()}/business/wallet`,
            }).catch((err: unknown) => console.error('Failed to send business cancel email:', err))
          }
        } else {
          // Send status update emails for non-cancellation status changes
          if (emailDetails.customerEmail) {
            sendBusinessBookingStatusUpdateEmail({
              email: emailDetails.customerEmail,
              businessName: emailDetails.businessName,
              bookingNumber: emailDetails.bookingNumber,
              tripNumber: emailDetails.tripNumber,
              customerName: emailDetails.customerName,
              pickupLocation: emailDetails.pickupLocation,
              dropoffLocation: emailDetails.dropoffLocation,
              pickupDateTime: emailDetails.pickupDateTime,
              previousStatus: 'pending',
              newStatus: status,
            }).catch((err: unknown) => console.error('Failed to send customer status email:', err))
          }

          if (emailDetails.businessEmail) {
            sendBusinessBookingStatusUpdateEmail({
              email: emailDetails.businessEmail,
              businessName: emailDetails.businessName,
              bookingNumber: emailDetails.bookingNumber,
              tripNumber: emailDetails.tripNumber,
              customerName: emailDetails.customerName,
              pickupLocation: emailDetails.pickupLocation,
              dropoffLocation: emailDetails.dropoffLocation,
              pickupDateTime: emailDetails.pickupDateTime,
              previousStatus: 'pending',
              newStatus: status,
            }).catch((err: unknown) => console.error('Failed to send business status email:', err))
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send status update emails:', emailError)
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

export async function exportBookingsToCSV(bookingIds: string[]) {
  const { bookings } = await getBookings({ limit: 10000 })

  // Filter to only selected bookings
  const selectedBookings = bookings.filter((b: any) => bookingIds.includes(b.id))

  const headers = [
    'Booking Number',
    'Booking Type',
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
    'Vendor',
    'Created At'
  ]

  const rows = selectedBookings.map((booking: any) => {
    const pickupDate = new Date(booking.pickup_datetime)
    const assignment = booking.booking_assignments?.[0]
    return [
      booking.booking_number,
      booking.bookingType || 'customer',
      booking.customer_name || '',
      booking.customer_email || '',
      booking.customer_phone || '',
      pickupDate.toLocaleDateString(),
      pickupDate.toLocaleTimeString(),
      booking.pickup_address,
      booking.dropoff_address,
      booking.vehicle_types?.name || '',
      booking.passenger_count,
      booking.luggage_count || 0,
      booking.base_price,
      booking.amenities_price || 0,
      booking.total_price,
      booking.booking_status,
      booking.payment_status || '',
      assignment?.vendor?.business_name || '',
      new Date(booking.created_at).toLocaleString()
    ]
  })

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
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

  // Update customer bookings
  const { error } = await adminClient
    .from('bookings')
    .update(updateData)
    .in('id', bookingIds)

  if (error) {
    console.error('Error bulk updating customer booking status:', error)
  }

  // Update business bookings
  const { error: bizError } = await adminClient
    .from('business_bookings')
    .update(updateData)
    .in('id', bookingIds)

  if (bizError) {
    console.error('Error bulk updating business booking status:', bizError)
  }

  if (error && bizError) {
    throw new Error('Failed to bulk update booking status')
  }

  // Send notifications for business bookings (fire-and-forget)
  Promise.allSettled(
    bookingIds.map(async (bookingId) => {
      try {
        const details = await getBusinessBookingEmailDetails(bookingId)
        if (!details) return

        if (status === 'cancelled' && details.customerEmail) {
          await sendBusinessCustomerBookingCancelledEmail({
            customerName: details.customerName,
            customerEmail: details.customerEmail,
            businessName: details.businessName,
            bookingNumber: details.bookingNumber,
            tripNumber: details.tripNumber,
            pickupLocation: details.pickupLocation,
            dropoffLocation: details.dropoffLocation,
            pickupDateTime: details.pickupDateTime,
            cancellationReason: 'Bulk cancellation by admin',
          })
        } else if (details.customerEmail) {
          await sendBusinessBookingStatusUpdateEmail({
            email: details.customerEmail,
            businessName: details.businessName,
            bookingNumber: details.bookingNumber,
            tripNumber: details.tripNumber,
            customerName: details.customerName,
            pickupLocation: details.pickupLocation,
            dropoffLocation: details.dropoffLocation,
            pickupDateTime: details.pickupDateTime,
            previousStatus: 'pending',
            newStatus: status,
          })
        }
      } catch (err) {
        console.error(`Failed to send email for bulk booking ${bookingId}:`, err)
      }
    })
  ).catch((err) => console.error('Bulk email notification error:', err))

  revalidatePath('/admin/bookings')

  return { success: true }
}

export async function deleteBooking(
  bookingId: string,
  bookingType: 'customer' | 'business'
) {
  const adminClient = createAdminClient()

  try {
    // Check for booking assignment and clean up availability
    const fieldName = bookingType === 'customer' ? 'booking_id' : 'business_booking_id'
    const { data: assignment } = await adminClient
      .from('booking_assignments')
      .select('id')
      .eq(fieldName, bookingId)
      .single()

    if (assignment) {
      const { AvailabilityService } = await import('@/lib/availability/service')
      await AvailabilityService.removeSchedule(assignment.id)
    }

    // Delete related records
    await adminClient
      .from('booking_assignments')
      .delete()
      .eq(fieldName, bookingId)

    if (bookingType === 'customer') {
      await adminClient
        .from('booking_passengers')
        .delete()
        .eq('booking_id', bookingId)

      await adminClient
        .from('booking_amenities')
        .delete()
        .eq('booking_id', bookingId)
    } else {
      await adminClient
        .from('business_booking_addons')
        .delete()
        .eq('business_booking_id', bookingId)
    }

    // Delete the booking itself
    const tableName = bookingType === 'customer' ? 'bookings' : 'business_bookings'
    const { error } = await adminClient
      .from(tableName)
      .delete()
      .eq('id', bookingId)

    if (error) {
      console.error('Error deleting booking:', error)
      return { error: 'Failed to delete booking' }
    }

    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (err) {
    console.error('Error deleting booking:', err)
    return { error: 'Failed to delete booking' }
  }
}

export async function bulkDeleteBookings(bookingIds: string[]) {
  const adminClient = createAdminClient()

  try {
    for (const bookingId of bookingIds) {
      // Try customer booking first
      const { data: customerBooking } = await adminClient
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .single()

      const bookingType: 'customer' | 'business' = customerBooking ? 'customer' : 'business'
      const result = await deleteBooking(bookingId, bookingType)

      if (result.error) {
        console.error(`Failed to delete booking ${bookingId}:`, result.error)
      }
    }

    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (err) {
    console.error('Error bulk deleting bookings:', err)
    return { error: 'Failed to delete some bookings' }
  }
}

export async function getAvailableVendors(vehicleTypeId?: string) {
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

  if (!vendors?.length) return []

  if (!vehicleTypeId) {
    return vendors.map(v => ({ ...v, hasMatchingVehicle: false }))
  }

  let matchingBusinessIds = new Set<string>()
  try {
    const { data: matchingVehicles } = await adminClient
      .from('vehicles')
      .select('business_id')
      .eq('vehicle_type_id', vehicleTypeId)

    if (matchingVehicles) {
      matchingBusinessIds = new Set(matchingVehicles.map(v => v.business_id))
    }
  } catch (err) {
    console.error('Error fetching matching vehicles:', err)
  }

  const annotated = vendors.map(v => ({
    ...v,
    hasMatchingVehicle: matchingBusinessIds.has(v.id),
  }))

  return annotated.sort((a, b) => {
    if (a.hasMatchingVehicle && !b.hasMatchingVehicle) return -1
    if (!a.hasMatchingVehicle && b.hasMatchingVehicle) return 1
    return a.business_name.localeCompare(b.business_name)
  })
}

/**
 * Assign (or reassign) booking to vendor (works for both customer and business bookings)
 * On reassignment: cancels old assignment, cleans up resources, notifies previous vendor.
 */
export async function assignBookingToVendor(
  bookingId: string,
  bookingType: BookingType,
  vendorId: string,
  notes?: string,
  reassignmentReason?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create assignment (automatically cancels any existing active assignment)
  const { cancelledAssignment, error } = await createBookingAssignment({
    bookingId: bookingType === 'customer' ? bookingId : undefined,
    businessBookingId: bookingType === 'business' ? bookingId : undefined,
    vendorId,
    assignedBy: user.id,
    cancellationReason: reassignmentReason,
    notes,
  })

  if (error) {
    console.error('Error creating booking assignment:', error)
    throw new Error('Failed to assign booking to vendor')
  }

  // If reassignment: clean up old resources and notify previous vendor
  if (cancelledAssignment) {
    // Free driver/vehicle schedules if old assignment was accepted
    if (cancelledAssignment.status === 'accepted') {
      try {
        const { AvailabilityService } = await import('@/lib/availability/service')
        await AvailabilityService.removeSchedule(cancelledAssignment.id)
      } catch (cleanupError) {
        console.error('Failed to clean up old assignment resources:', cleanupError)
      }
    }

    // Notify previous vendor (non-blocking)
    try {
      const adminClient = createAdminClient()
      const { data: oldVendor } = await adminClient
        .from('vendor_applications')
        .select('business_name, business_email')
        .eq('id', cancelledAssignment.vendor_id)
        .single()

      if (oldVendor?.business_email) {
        const bookingDetails = await getBookingDetailsForEmail(bookingId, bookingType)
        if (bookingDetails) {
          await sendBookingUnassignmentEmail({
            vendorName: oldVendor.business_name,
            vendorEmail: oldVendor.business_email,
            bookingReference: bookingDetails.bookingNumber,
            tripNumber: bookingDetails.tripNumber || undefined,
            customerName: bookingDetails.customerName,
            pickupLocation: bookingDetails.pickupAddress,
            pickupDate: bookingDetails.pickupDate,
            pickupTime: bookingDetails.pickupTime,
            reassignmentReason,
            bookingUrl: `${getAppUrl()}/vendor/bookings`,
          })
        }
      }
    } catch (emailError) {
      console.error('Failed to send unassignment email to previous vendor:', emailError)
    }

    // Notify previous driver if one was assigned (non-blocking)
    if (cancelledAssignment.driver_id) {
      try {
        const driverAdminClient = createAdminClient()
        const { data: oldDriver } = await driverAdminClient
          .from('vendor_drivers')
          .select('first_name, last_name, email')
          .eq('id', cancelledAssignment.driver_id)
          .single()

        if (oldDriver?.email) {
          const { data: oldVendorForDriver } = await driverAdminClient
            .from('vendor_applications')
            .select('business_name')
            .eq('id', cancelledAssignment.vendor_id)
            .single()

          const driverBookingDetails = await getBookingDetailsForEmail(bookingId, bookingType)
          if (driverBookingDetails) {
            await sendDriverBookingUnassignmentEmail({
              driverName: `${oldDriver.first_name} ${oldDriver.last_name}`,
              driverEmail: oldDriver.email,
              bookingReference: driverBookingDetails.bookingNumber,
              tripNumber: driverBookingDetails.tripNumber || undefined,
              customerName: driverBookingDetails.customerName,
              pickupLocation: driverBookingDetails.pickupAddress,
              pickupDate: driverBookingDetails.pickupDate,
              pickupTime: driverBookingDetails.pickupTime,
              reason: reassignmentReason,
              vendorName: oldVendorForDriver?.business_name || 'Your Company',
            })
          }
        }
      } catch (driverEmailError) {
        console.error('Failed to send driver unassignment email (non-critical):', driverEmailError)
      }
    }
  }

  // Send assignment email to new vendor (non-blocking)
  try {
    const bookingDetails = await getBookingDetailsForEmail(bookingId, bookingType)
    if (bookingDetails) {
      const adminClient = createAdminClient()
      const { data: vendor } = await adminClient
        .from('vendor_applications')
        .select('business_name, business_email')
        .eq('id', vendorId)
        .single()

      if (vendor?.business_email) {
        await sendBookingAssignmentEmail({
          bookingId,
          vendorName: vendor.business_name,
          vendorEmail: vendor.business_email,
          bookingReference: bookingDetails.bookingNumber,
          tripNumber: bookingDetails.tripNumber || undefined,
          customerName: bookingDetails.customerName,
          vehicleCategory: bookingDetails.vehicleCategory,
          vehicleType: bookingDetails.vehicleType,
          pickupLocation: bookingDetails.pickupAddress,
          dropoffLocation: bookingDetails.dropoffAddress,
          pickupDate: bookingDetails.pickupDate,
          pickupTime: bookingDetails.pickupTime,
          bookingUrl: `${getAppUrl()}/vendor/bookings`,
        })
      }
    }
  } catch (emailError) {
    console.error('Failed to send booking assignment email:', emailError)
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)

  return { success: true }
}

/**
 * Helper: fetch booking details needed for email notifications
 */
async function getBookingDetailsForEmail(bookingId: string, bookingType: BookingType) {
  const adminClient = createAdminClient()

  let bookingNumber = ''
  let tripNumber = ''
  let pickupAddress = 'TBD'
  let dropoffAddress = 'TBD'
  let pickupDatetimeStr = ''
  let vehicleTypeId = ''
  let customerName = 'Customer'

  if (bookingType === 'business') {
    const { data: booking } = await adminClient
      .from('business_bookings')
      .select('booking_number, trip_number, pickup_address, dropoff_address, pickup_datetime, vehicle_type_id, customer_name')
      .eq('id', bookingId)
      .single()
    if (!booking) return null
    bookingNumber = booking.booking_number
    tripNumber = booking.trip_number || ''
    pickupAddress = booking.pickup_address || 'TBD'
    dropoffAddress = booking.dropoff_address || 'TBD'
    pickupDatetimeStr = booking.pickup_datetime
    vehicleTypeId = booking.vehicle_type_id
    customerName = booking.customer_name || 'Customer'
  } else {
    const { data: booking } = await adminClient
      .from('bookings')
      .select('booking_number, trip_number, pickup_address, dropoff_address, pickup_datetime, vehicle_type_id, customer_id')
      .eq('id', bookingId)
      .single()
    if (!booking) return null
    bookingNumber = booking.booking_number
    tripNumber = booking.trip_number || ''
    pickupAddress = booking.pickup_address || 'TBD'
    dropoffAddress = booking.dropoff_address || 'TBD'
    pickupDatetimeStr = booking.pickup_datetime
    vehicleTypeId = booking.vehicle_type_id
    if (booking.customer_id) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name')
        .eq('id', booking.customer_id)
        .single()
      customerName = profile?.full_name || 'Customer'
    }
  }

  const { data: vehicleType } = await adminClient
    .from('vehicle_types')
    .select('name, vehicle_categories(name)')
    .eq('id', vehicleTypeId)
    .single()

  const pickupDatetime = parseISO(pickupDatetimeStr)
  const categoryName = (vehicleType as any)?.vehicle_categories?.name || 'Vehicle'

  return {
    bookingNumber,
    tripNumber,
    customerName,
    vehicleCategory: categoryName,
    vehicleType: vehicleType?.name || 'Vehicle',
    pickupAddress,
    dropoffAddress,
    pickupDate: format(pickupDatetime, 'MMMM d, yyyy'),
    pickupTime: format(pickupDatetime, 'h:mm a'),
  }
}

/**
 * Helper: fetch business booking details needed for email notifications
 */
async function getBusinessBookingEmailDetails(bookingId: string) {
  const adminClient = createAdminClient()

  const { data: booking } = await adminClient
    .from('business_bookings')
    .select(`
      booking_number, trip_number, customer_name, customer_email,
      pickup_address, dropoff_address, pickup_datetime,
      business_account_id,
      from_location:from_location_id(name),
      to_location:to_location_id(name)
    `)
    .eq('id', bookingId)
    .single()

  if (!booking) return null

  const { data: account } = await adminClient
    .from('business_accounts')
    .select('business_name, business_email, currency')
    .eq('id', booking.business_account_id)
    .single()

  const pickupLocation = (booking.from_location as any)?.name
    ? `${(booking.from_location as any).name}${booking.pickup_address ? ` - ${booking.pickup_address}` : ''}`
    : booking.pickup_address || 'N/A'

  const dropoffLocation = (booking.to_location as any)?.name
    ? `${(booking.to_location as any).name}${booking.dropoff_address ? ` - ${booking.dropoff_address}` : ''}`
    : booking.dropoff_address || 'N/A'

  const pickupDateTime = new Date(booking.pickup_datetime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return {
    bookingNumber: booking.booking_number,
    tripNumber: booking.trip_number || undefined,
    customerName: booking.customer_name || 'Customer',
    customerEmail: booking.customer_email,
    businessName: account?.business_name || 'Business',
    businessEmail: account?.business_email || '',
    currency: account?.currency || 'AED',
    pickupLocation,
    dropoffLocation,
    pickupDateTime,
  }
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