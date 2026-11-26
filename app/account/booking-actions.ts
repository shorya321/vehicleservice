"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitiseSearchTerm } from "@/lib/supabase/search-term"
import type { BookingFiltersData } from "./schemas"
import { loadAccountTripGroup } from "./lib/trip-group"
import { groupTripRows } from "@/lib/trips/group-list-rows"

export interface BookingFilters {
  search?: string
  status?: "all" | "confirmed" | "completed" | "cancelled" | "pending"
  paymentStatus?: "all" | "completed" | "processing" | "failed" | "refunded"
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

/**
 * The empty result. Returned rather than thrown so the caller renders its ordinary empty state:
 * a customer who is signed out mid-session should see "no bookings", not a crash.
 */
const NO_BOOKINGS = { bookings: [], total: 0, page: 1, totalPages: 0 }

/**
 * `userId` is supplied by the caller and this is a server action, so it is reachable by anyone
 * with a session. It is checked against the session rather than trusted, matching what
 * updateNotificationPreferences in ./actions.ts already does. Without this, passing another
 * customer's id returned that customer's bookings: the query runs on the admin client, which
 * bypasses the RLS policy that would otherwise have caught it.
 */
export async function getBookings(userId: string, filters: BookingFilters = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return NO_BOOKINGS
  }

  const adminClient = createAdminClient()
  const limit = filters.limit || 10
  const page = filters.page || 1
  const offset = (page - 1) * limit

  let query = adminClient
    .from("bookings")
    .select(`
      *,
      vehicle_type:vehicle_types(name, image_url),
      booking_group:booking_group_id(group_number, leg_count),
      booking_assignments (
        status,
        vendor:vendor_applications (business_name),
        driver:vendor_drivers (first_name, last_name, phone)
      )
    `)
    .eq("customer_id", userId)

  // or() takes a filter expression, not a bound value, so the raw term could close one condition
  // and open another. See lib/supabase/search-term.ts.
  const search = filters.search ? sanitiseSearchTerm(filters.search) : ""
  if (search) {
    query = query.or(
      `booking_number.ilike.%${search}%,` +
      `trip_number.ilike.%${search}%,` +
      `pickup_address.ilike.%${search}%,` +
      `dropoff_address.ilike.%${search}%`
    )
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("booking_status", filters.status)
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus)
  }

  if (filters.dateFrom) {
    query = query.gte("pickup_datetime", filters.dateFrom.toISOString())
  }

  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("pickup_datetime", endOfDay.toISOString())
  }

  // The journeys of one trip share a created_at; keep them in travel order.
  query = query
    .order("created_at", { ascending: false })
    .order("leg_index", { ascending: true, nullsFirst: true })

  // A round trip or multi-city order is one row carrying its journeys in trip_legs. Grouping has
  // to happen before the page is cut, or one trip's journeys could straddle two pages, so the
  // whole matching set is read and paged here. One customer's bookings are a short list.
  const { data: bookings } = await query
  const trips = groupTripRows(bookings || [])

  return {
    bookings: trips.slice(offset, offset + limit),
    total: trips.length,
    page,
    totalPages: Math.ceil(trips.length / limit),
  }
}

/** Same reasoning as getBookings: the id is checked against the session, never trusted. */
export async function getBookingStats(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { total: 0, upcoming: 0, completed: 0, travelled: 0, cancelled: 0 }
  }

  const adminClient = createAdminClient()
  const nowIso = new Date().toISOString()

  const [total, upcoming, completed, travelled, cancelled] = await Promise.all([
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .then(r => r.count || 0),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "confirmed")
      .gte("pickup_datetime", nowIso)
      .then(r => r.count || 0),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "completed")
      .then(r => r.count || 0),
    // Travelled, by the clock rather than by booking_status.
    //
    // booking_status only reaches "completed" when a vendor closes the job, which in practice
    // often does not happen, so the "travelled" figure read 0 to a customer looking at a list
    // of trips they had plainly already taken. A pickup in the past that was never cancelled
    // has been travelled. `completed` is kept above: it is the vendor's own count, and the two
    // are different questions.
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .neq("booking_status", "cancelled")
      .lt("pickup_datetime", nowIso)
      .then(r => r.count || 0),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "cancelled")
      .then(r => r.count || 0),
  ])

  return { total, upcoming, completed, travelled, cancelled }
}

/**
 * One select for every full read of a booking. Additive against what getBookingDetails already
 * fetched: the passenger rows, the child ages a seat add-on carries, and the vehicle capacities
 * the itinerary card states in words.
 */
const BOOKING_DETAIL_SELECT = `
  *,
  vehicle_type:vehicle_types(name, image_url, description, passenger_capacity, luggage_capacity),
  booking_assignments (
    status,
    assigned_at,
    accepted_at,
    completed_at,
    vendor:vendor_applications (business_name, business_phone, business_email),
    driver:vendor_drivers (first_name, last_name, phone),
    vehicle:vehicles (make, model, year, registration_number)
  ),
  booking_passengers (first_name, last_name, email, phone, is_primary),
  booking_amenities (
    id,
    amenity_type,
    quantity,
    price,
    addon_id,
    child_ages,
    addon:addons (name, price, description)
  )
`

export async function getBookingDetails(bookingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  const { data: booking, error } = await adminClient
    .from("bookings")
    .select(BOOKING_DETAIL_SELECT)
    .eq("id", bookingId)
    .single()

  if (error) {
    console.error("Get booking details error:", error)
    return { data: null, error: "Booking not found" }
  }

  if (booking.customer_id !== user.id) {
    return { data: null, error: "Unauthorized" }
  }

  return { data: booking, error: null }
}

/**
 * A reference is what the customer reads off the screen and out of an email, so it is what the
 * detail page is keyed on. trip_number is NOT NULL and unique; booking_number is the fallback for
 * anything predating the trip-number migration, which is also the key the invoice route uses.
 *
 * Two sequential eq() lookups rather than one or(). The reference arrives from a URL segment, and
 * PostgREST's or() takes a filter expression, so interpolating user input into it lets a comma or
 * a parenthesis rewrite the filter tree. eq() binds its value.
 */
const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/

export async function getBookingByReference(reference: string) {
  if (!REFERENCE_PATTERN.test(reference)) {
    return { data: null, error: "Booking not found" }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  const lookup = (column: "trip_number" | "booking_number") =>
    adminClient
      .from("bookings")
      .select(BOOKING_DETAIL_SELECT)
      .eq(column, reference)
      .maybeSingle()

  let { data: booking, error } = await lookup("trip_number")

  if (!booking && !error) {
    ;({ data: booking, error } = await lookup("booking_number"))
  }

  if (error) {
    console.error("Get booking by reference error:", error)
    return { data: null, error: "Booking not found" }
  }

  if (!booking) {
    return { data: null, error: "Booking not found" }
  }

  // The admin client bypasses RLS, so ownership is enforced here. The caller turns both this and
  // the not-found case into a 404, so the page cannot be used to probe which references exist.
  if (booking.customer_id !== user.id) {
    return { data: null, error: "Unauthorized" }
  }

  const trip_group = booking.booking_group_id
    ? await loadAccountTripGroup(adminClient, booking.booking_group_id)
    : null

  return { data: { ...booking, trip_group }, error: null }
}

