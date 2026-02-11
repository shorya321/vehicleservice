"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
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

export async function getBookings(userId: string, filters: BookingFilters = {}) {
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

  if (filters.search) {
    query = query.or(
      `booking_number.ilike.%${filters.search}%,` +
      `pickup_address.ilike.%${filters.search}%,` +
      `dropoff_address.ilike.%${filters.search}%`
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

export async function getBookingStats(userId: string) {
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

export async function getBookingDetails(bookingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Unauthorized" }
  }

  const adminClient = createAdminClient()

  const { data: booking, error } = await adminClient
    .from("bookings")
    .select(`
      *,
      vehicle_type:vehicle_types(name, image_url, description),
      booking_assignments (
        status,
        assigned_at,
        accepted_at,
        completed_at,
        vendor:vendor_applications (business_name, business_phone, business_email),
        driver:vendor_drivers (first_name, last_name, phone),
        vehicle:vehicles (make, model, year, registration_number)
      ),
      booking_amenities (
        id,
        amenity_type,
        quantity,
        price,
        addon:addons (name, price, description)
      )
    `)
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

  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId)

  if (error) {
    console.error("Cancel booking error:", error)
    return { error: "Failed to cancel booking" }
  }

  revalidatePath("/account")
  return {}
}
