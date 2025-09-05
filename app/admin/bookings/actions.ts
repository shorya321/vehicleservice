'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface BookingFilters {
  search?: string
  status?: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
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
}

export async function getBookings(filters: BookingFilters = {}) {
  const adminClient = createAdminClient()
  
  const { 
    search = '', 
    status = 'all', 
    paymentStatus = 'all',
    vehicleTypeId,
    dateFrom,
    dateTo,
    customerId,
    page = 1, 
    limit = 10
  } = filters

  // Build base query with proper joins
  let query = adminClient
    .from('bookings')
    .select(`
      *,
      customer:profiles(
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
      from_location:locations!bookings_from_location_id_fkey(
        id,
        name,
        type
      ),
      to_location:locations!bookings_to_location_id_fkey(
        id,
        name,
        type
      ),
      from_zone:zones!bookings_from_zone_id_fkey(
        id,
        name,
        description
      ),
      to_zone:zones!bookings_to_zone_id_fkey(
        id,
        name,
        description
      )
    `, { count: 'exact' })

  // Apply search filter
  if (search) {
    query = query.or(
      `booking_number.ilike.%${search}%,` +
      `pickup_address.ilike.%${search}%,` +
      `dropoff_address.ilike.%${search}%`
    )
  }

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('booking_status', status)
  }

  // Apply payment status filter
  if (paymentStatus !== 'all') {
    query = query.eq('payment_status', paymentStatus)
  }

  // Apply vehicle type filter
  if (vehicleTypeId) {
    query = query.eq('vehicle_type_id', vehicleTypeId)
  }

  // Apply customer filter
  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  // Apply date range filter
  if (dateFrom) {
    query = query.gte('pickup_datetime', dateFrom)
  }
  if (dateTo) {
    const endOfDay = new Date(dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('pickup_datetime', endOfDay.toISOString())
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data: bookings, error, count } = await query

  if (error) {
    console.error('Error fetching bookings:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to fetch bookings: ${error.message}`)
  }

  return {
    bookings: (bookings || []) as BookingWithCustomer[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getBookingDetails(bookingId: string) {
  const adminClient = createAdminClient()
  
  // Get booking details with proper joins
  const { data: booking, error } = await adminClient
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
      from_location:locations!bookings_from_location_id_fkey(
        id,
        name,
        type
      ),
      to_location:locations!bookings_to_location_id_fkey(
        id,
        name,
        type
      ),
      from_zone:zones!bookings_from_zone_id_fkey(
        id,
        name,
        description
      ),
      to_zone:zones!bookings_to_zone_id_fkey(
        id,
        name,
        description
      )
    `)
    .eq('id', bookingId)
    .single()

  if (error) {
    console.error('Error fetching booking details:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to fetch booking details: ${error.message}`)
  }

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

  return {
    ...booking,
    booking_passengers: passengers || [],
    booking_amenities: amenities || []
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
  
  // Get total bookings
  const { count: totalBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
  
  // Get today's bookings
  const { count: todayBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString())
  
  // Get upcoming bookings
  const { count: upcomingBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('booking_status', 'confirmed')
    .gte('pickup_datetime', now.toISOString())
  
  // Get completed bookings
  const { count: completedBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('booking_status', 'completed')
  
  // Get cancelled bookings
  const { count: cancelledBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('booking_status', 'cancelled')
  
  // Calculate total revenue from completed payments
  const { data: revenueData } = await adminClient
    .from('bookings')
    .select('total_price')
    .eq('payment_status', 'completed')
  
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