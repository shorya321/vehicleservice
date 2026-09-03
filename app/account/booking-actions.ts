"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { closeActiveAssignments } from "@/lib/bookings/unified-service"
import { sanitiseSearchTerm } from "@/lib/supabase/search-term"
import type { BookingFiltersData } from "./schemas"

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
      booking_assignments (
        status,
        vendor:vendor_applications (business_name),
        driver:vendor_drivers (first_name, last_name, phone)
      )
    `, { count: "exact" })
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

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

  const { data: bookings, count } = await query

  return {
    bookings: bookings || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

/** Same reasoning as getBookings: the id is checked against the session, never trusted. */
export async function getBookingStats(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { total: 0, upcoming: 0, completed: 0, cancelled: 0 }
  }

  const adminClient = createAdminClient()

  const [total, upcoming, completed, cancelled] = await Promise.all([
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
      .gte("pickup_datetime", new Date().toISOString())
      .then(r => r.count || 0),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "completed")
      .then(r => r.count || 0),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "cancelled")
      .then(r => r.count || 0),
  ])

  return { total, upcoming, completed, cancelled }
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

  return { data: booking, error: null }
}

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("customer_id, pickup_datetime, booking_status")
    .eq("id", bookingId)
    .single()

  if (!booking) {
    return { error: "Booking not found" }
  }

  if (booking.customer_id !== user.id) {
    return { error: "Unauthorized" }
  }

  if (booking.booking_status !== "confirmed" && booking.booking_status !== "pending") {
    return { error: "Cannot cancel this booking" }
  }

  const pickupTime = new Date(booking.pickup_datetime)
  const now = new Date()
  const hoursUntilPickup = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilPickup < 24) {
    return { error: "Bookings can only be cancelled 24+ hours before pickup" }
  }

  const cancelledAt = new Date().toISOString()

  // Written with the admin client on purpose. `bookings` has SELECT policies for customers
  // but no UPDATE policy, so the RLS client silently matched zero rows and returned no
  // error. The booking stayed confirmed while the UI reported success. Authorisation is
  // enforced above in code: the caller is authenticated, owns this booking, it is still
  // cancellable, and pickup is more than 24h away.
  const adminClient = createAdminClient()

  const { data: cancelled, error } = await adminClient
    .from("bookings")
    .update({
      booking_status: "cancelled",
      cancelled_at: cancelledAt,
      cancellation_reason: "Cancelled by customer",
      updated_at: cancelledAt,
    })
    .eq("id", bookingId)
    .eq("customer_id", user.id) // belt-and-braces: the ownership check, restated in SQL
    .select("id")

  if (error) {
    console.error("Cancel booking error:", error)
    return { error: "Failed to cancel booking" }
  }

  if (!cancelled || cancelled.length === 0) {
    console.error("Cancel booking affected no rows:", { bookingId, userId: user.id })
    return { error: "Failed to cancel booking" }
  }

  // Close the vendor's assignment and release the vehicle and driver. Without this the
  // resources stay blocked in resource_schedules for a trip that is no longer happening.
  const { error: closeError } = await closeActiveAssignments({
    bookingId,
    outcome: "cancelled",
    reason: "Cancelled by customer",
  })

  if (closeError) {
    // The booking is already cancelled; surfacing a failure here would be misleading.
    console.error("Failed to close assignment after customer cancellation:", closeError)
  }

  revalidatePath("/account")
  revalidatePath("/account/bookings/[reference]", "page")
  revalidatePath("/vendor/bookings")
  revalidatePath("/vendor/availability")
  return {}
}
