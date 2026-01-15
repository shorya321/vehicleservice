/**
 * Unified Booking Service
 *
 * Provides helper functions to work with both customer and business bookings
 * through a unified interface. Enables admin to view and assign both types
 * while maintaining a completely unified vendor experience.
 *
 * Key Functions:
 * - getUnifiedBookingDetails: Fetch single booking (customer OR business)
 * - getBookingFromAssignment: Get booking details from assignment ID
 * - createBookingAssignment: Create assignment for either booking type
 * - getUnifiedBookingsList: Fetch all bookings with filters (UNION query)
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Database } from '@/lib/supabase/types';

export type BookingType = 'customer' | 'business';

/**
 * Unified booking interface - common fields from both booking types
 */
export interface UnifiedBooking {
  id: string;
  bookingType: BookingType;
  bookingNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  pickupDatetime: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  fromLocationId: string;
  toLocationId: string;
  vehicleTypeId: string;
  passengerCount: number;
  luggageCount: number;
  basePrice: number;
  totalPrice: number;
  bookingStatus: string;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Related data (populated via joins)
  fromLocations?: {
    name: string;
    city: string | null;
  };
  toLocations?: {
    name: string;
    city: string | null;
  };
  vehicleTypes?: {
    name: string;
    description: string | null;
    passengerCapacity: number;
    luggageCapacity: number;
    vehicleCategories?: {
      name: string;
    } | null;
  };
}

/**
 * Get booking details regardless of type (customer or business)
 *
 * @param bookingId - Customer booking ID (optional)
 * @param businessBookingId - Business booking ID (optional)
 * @returns Unified booking object or null if not found
 *
 * @example
 * // Fetch customer booking
 * const booking = await getUnifiedBookingDetails('customer-uuid', undefined);
 *
 * // Fetch business booking
 * const booking = await getUnifiedBookingDetails(undefined, 'business-uuid');
 */
export async function getUnifiedBookingDetails(
  bookingId?: string,
  businessBookingId?: string
): Promise<UnifiedBooking | null> {
  // Use admin client to bypass RLS and avoid circular dependencies
  // Security is already enforced at the booking_assignments level
  const supabase = createAdminClient();

  // Fetch customer booking
  if (bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_customer_id_fkey(full_name, email, phone),
        from_locations:from_location_id(name, city),
        to_locations:to_location_id(name, city),
        vehicle_types:vehicle_type_id(
          name,
          description,
          passenger_capacity,
          luggage_capacity,
          vehicle_categories:category_id(name)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      console.error('Error fetching customer booking:', error);
      return null;
    }

    return {
      id: data.id,
      bookingType: 'customer',
      bookingNumber: data.booking_number,
      customerName: (data as any).profiles?.full_name || 'Unknown',
      customerEmail: (data as any).profiles?.email || null,
      customerPhone: (data as any).profiles?.phone || null,
      pickupDatetime: data.pickup_datetime,
      pickupAddress: data.pickup_address,
      dropoffAddress: data.dropoff_address,
      fromLocationId: data.from_location_id,
      toLocationId: data.to_location_id,
      vehicleTypeId: data.vehicle_type_id,
      passengerCount: data.passenger_count,
      luggageCount: data.luggage_count || 0,
      basePrice: data.base_price,
      totalPrice: data.total_price,
      bookingStatus: data.booking_status,
      customerNotes: data.customer_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      fromLocations: data.from_locations,
      toLocations: data.to_locations,
      vehicleTypes: data.vehicle_types,
    };
  }

  // Fetch business booking
  if (businessBookingId) {
    console.log(`🏢 Fetching business booking ${businessBookingId}`);

    const { data, error } = await supabase
      .from('business_bookings')
      .select(`
        *,
        from_locations:from_location_id(name, city),
        to_locations:to_location_id(name, city),
        vehicle_types:vehicle_type_id(
          name,
          description,
          passenger_capacity,
          luggage_capacity,
          vehicle_categories:category_id(name)
        )
      `)
      .eq('id', businessBookingId)
      .single();

    if (error || !data) {
      console.error(`❌ Error fetching business booking ${businessBookingId}:`, error);
      console.error(`❌ Error code: ${error?.code}, Message: ${error?.message}`);
      return null;
    }

    console.log(`✅ Successfully fetched business booking ${businessBookingId}`);


    return {
      id: data.id,
      bookingType: 'business',
      bookingNumber: data.booking_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email || null,
      customerPhone: data.customer_phone || null,
      pickupDatetime: data.pickup_datetime,
      pickupAddress: data.pickup_address,
      dropoffAddress: data.dropoff_address,
      fromLocationId: data.from_location_id,
      toLocationId: data.to_location_id,
      vehicleTypeId: data.vehicle_type_id,
      passengerCount: data.passenger_count,
      luggageCount: data.luggage_count || 0,
      basePrice: data.base_price,
      totalPrice: data.total_price,
      bookingStatus: data.booking_status,
      customerNotes: data.customer_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      fromLocations: data.from_locations,
      toLocations: data.to_locations,
      vehicleTypes: data.vehicle_types,
    };
  }

  return null;
}

/**
 * Get booking details from assignment ID
 *
 * Automatically detects booking type from the assignment and fetches
 * the appropriate booking details.
 *
 * @param assignmentId - Booking assignment ID
 * @returns Unified booking object or null if not found
 *
 * @example
 * const booking = await getBookingFromAssignment('assignment-uuid');
 * console.log(booking.bookingType); // 'customer' or 'business'
 */
export async function getBookingFromAssignment(
  assignmentId: string
): Promise<UnifiedBooking | null> {
  // Use admin client to bypass RLS and avoid circular dependencies
  // Security is already enforced at the booking_assignments level
  const supabase = createAdminClient();

  // Get assignment to determine booking type
  const { data: assignment, error } = await supabase
    .from('booking_assignments')
    .select('booking_id, business_booking_id')
    .eq('id', assignmentId)
    .single();

  if (error || !assignment) {
    console.error(`❌ Error fetching assignment ${assignmentId}:`, error);
    return null;
  }

  console.log(`📦 Assignment ${assignmentId}: booking_id=${assignment.booking_id}, business_booking_id=${assignment.business_booking_id}`);

  // Fetch appropriate booking
  const result = await getUnifiedBookingDetails(
    assignment.booking_id || undefined,
    assignment.business_booking_id || undefined
  );

  if (!result) {
    console.error(`❌ getUnifiedBookingDetails returned null for assignment ${assignmentId}`);
  }

  return result;
}

/**
 * Create booking assignment (works for both customer and business bookings)
 *
 * @param params - Assignment parameters
 * @returns Created assignment or error
 *
 * @example
 * // Assign customer booking
 * await createBookingAssignment({
 *   bookingId: 'customer-uuid',
 *   vendorId: 'vendor-uuid',
 *   assignedBy: 'admin-uuid',
 * });
 *
 * // Assign business booking
 * await createBookingAssignment({
 *   businessBookingId: 'business-uuid',
 *   vendorId: 'vendor-uuid',
 *   assignedBy: 'admin-uuid',
 * });
 */
export async function createBookingAssignment(params: {
  bookingId?: string;
  businessBookingId?: string;
  vendorId: string;
  assignedBy: string;
}) {
  const supabase = await createClient();

  const assignment = {
    booking_id: params.bookingId || null,
    business_booking_id: params.businessBookingId || null,
    vendor_id: params.vendorId,
    assigned_by: params.assignedBy,
    status: 'pending' as const,
    assigned_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('booking_assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) {
    console.error('Error creating booking assignment:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Filters for unified bookings list
 */
export interface UnifiedBookingsFilters {
  status?: string;
  bookingType?: 'customer' | 'business' | 'all';
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all bookings (customer + business) for admin view
 *
 * Performs UNION query to combine both booking types into a single list.
 * Supports filtering, search, and pagination.
 *
 * @param filters - Query filters
 * @returns Unified list of bookings with total count
 *
 * @example
 * // Get all pending bookings
 * const { bookings } = await getUnifiedBookingsList({ status: 'pending' });
 *
 * // Get only business bookings
 * const { bookings } = await getUnifiedBookingsList({ bookingType: 'business' });
 *
 * // Search by customer name
 * const { bookings } = await getUnifiedBookingsList({ search: 'John' });
 */
export async function getUnifiedBookingsList(filters?: UnifiedBookingsFilters) {
  const supabase = createAdminClient();

  const shouldFetchCustomer = !filters?.bookingType || filters.bookingType === 'all' || filters.bookingType === 'customer';
  const shouldFetchBusiness = !filters?.bookingType || filters.bookingType === 'all' || filters.bookingType === 'business';

  // Build customer bookings query
  // Note: Use simple query and manually join customer data to avoid RLS issues
  let customerQuery = supabase
    .from('bookings')
    .select(`
      *,
      from_locations:from_location_id(name, city),
      to_locations:to_location_id(name, city),
      vehicle_types:vehicle_type_id(name, description)
    `, { count: 'exact' });

  // Build business bookings query
  // Note: business_bookings doesn't have luggage_count column
  let businessQuery = supabase
    .from('business_bookings')
    .select(`
      id,
      booking_number,
      customer_name,
      customer_email,
      customer_phone,
      pickup_datetime,
      pickup_address,
      dropoff_address,
      from_location_id,
      to_location_id,
      vehicle_type_id,
      passenger_count,
      base_price,
      total_price,
      booking_status,
      payment_status,
      customer_notes,
      created_at,
      updated_at,
      from_locations:from_location_id(name, city),
      to_locations:to_location_id(name, city),
      vehicle_types:vehicle_type_id(name, description)
    `, { count: 'exact' });

  // Apply filters to both queries
  if (filters?.status) {
    customerQuery = customerQuery.eq('booking_status', filters.status);
    businessQuery = businessQuery.eq('booking_status', filters.status);
  }

  if (filters?.fromDate) {
    customerQuery = customerQuery.gte('pickup_datetime', filters.fromDate);
    businessQuery = businessQuery.gte('pickup_datetime', filters.fromDate);
  }

  if (filters?.toDate) {
    customerQuery = customerQuery.lte('pickup_datetime', filters.toDate);
    businessQuery = businessQuery.lte('pickup_datetime', filters.toDate);
  }

  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    // For customer bookings, only search by booking_number since customer data is joined
    customerQuery = customerQuery.ilike('booking_number', searchPattern);
    // For business bookings, search both customer_name and booking_number
    businessQuery = businessQuery.or(`customer_name.ilike.${searchPattern},booking_number.ilike.${searchPattern}`);
  }

  // Execute queries based on filter
  const results = await Promise.all([
    shouldFetchCustomer ? customerQuery : Promise.resolve({ data: [], count: 0 }),
    shouldFetchBusiness ? businessQuery : Promise.resolve({ data: [], count: 0 }),
  ]);

  const [customerResult, businessResult] = results;

  // Check for query errors
  if ((customerResult as any).error) {
    console.error('Customer bookings query error:', (customerResult as any).error);
  }
  if ((businessResult as any).error) {
    console.error('Business bookings query error:', (businessResult as any).error);
  }

  // Manually fetch customer profiles for customer bookings
  let customerBookings: any[] = [];
  if (customerResult.data && customerResult.data.length > 0) {
    const customerIds = customerResult.data.map((b: any) => b.customer_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', customerIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    customerBookings = customerResult.data.map((b: any) => {
      const profile = profilesMap.get(b.customer_id);
      return {
        ...b,
        bookingType: 'customer' as const,
        customer_name: profile?.full_name || 'Unknown',
        customer_email: profile?.email || null,
        customer_phone: profile?.phone || null,
      };
    });
  }

  const businessBookings = (businessResult.data || []).map(b => ({
    ...b,
    bookingType: 'business' as const,
  }));

  // Fetch booking assignments for all bookings
  const allBookingIds = [...customerBookings.map(b => b.id), ...businessBookings.map(b => b.id)];

  if (allBookingIds.length > 0) {
    // Fetch assignments for customer bookings
    const { data: customerAssignments } = await supabase
      .from('booking_assignments')
      .select(`
        id,
        booking_id,
        business_booking_id,
        vendor_id,
        status,
        vendor:vendor_applications!left(id, business_name)
      `)
      .in('booking_id', customerBookings.map(b => b.id));

    // Fetch assignments for business bookings
    const { data: businessAssignments } = await supabase
      .from('booking_assignments')
      .select(`
        id,
        booking_id,
        business_booking_id,
        vendor_id,
        status,
        vendor:vendor_applications!left(id, business_name)
      `)
      .in('business_booking_id', businessBookings.map(b => b.id));

    // Create assignment maps
    const customerAssignmentMap = new Map(
      (customerAssignments || []).map(a => [a.booking_id, a])
    );
    const businessAssignmentMap = new Map(
      (businessAssignments || []).map(a => [a.business_booking_id, a])
    );

    // Add assignments to bookings
    customerBookings = customerBookings.map(b => ({
      ...b,
      booking_assignments: customerAssignmentMap.get(b.id) ? [customerAssignmentMap.get(b.id)] : [],
    }));

    businessBookings.forEach((b, index) => {
      businessBookings[index] = {
        ...b,
        booking_assignments: businessAssignmentMap.get(b.id) ? [businessAssignmentMap.get(b.id)] : [],
      };
    });
  }

  // Merge and sort by pickup datetime (most recent first)
  const allBookings = [...customerBookings, ...businessBookings]
    .sort((a, b) => new Date(b.pickup_datetime).getTime() - new Date(a.pickup_datetime).getTime());

  // Apply pagination if specified
  const paginatedBookings = filters?.limit
    ? allBookings.slice(filters.offset || 0, (filters.offset || 0) + filters.limit)
    : allBookings;

  return {
    bookings: paginatedBookings,
    totalCount: (customerResult.count || 0) + (businessResult.count || 0),
  };
}
