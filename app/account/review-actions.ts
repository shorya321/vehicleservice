"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ReviewFormData, ReviewFiltersData } from "./schemas"

export interface ReviewFilters {
  search?: string
  sortBy?: "newest" | "oldest" | "highest" | "lowest"
  status?: "all" | "pending" | "approved"
  ratingRange?: "all" | "5" | "4-5" | "1-3"
  page?: number
  limit?: number
}

export async function getMyReviews(filters: ReviewFilters = {}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated", total: 0, totalPages: 0 }
  }

  const limit = filters.limit || 20
  const page = filters.page || 1
  const offset = (page - 1) * limit

  let query = supabase
    .from("reviews")
    .select(`
      *,
      customer:profiles!reviews_customer_id_fkey(full_name, email, avatar_url)
    `, { count: "exact" })
    .eq("customer_id", user.id)

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  if (filters.ratingRange && filters.ratingRange !== "all") {
    switch (filters.ratingRange) {
      case "5":
        query = query.eq("rating", 5)
        break
      case "4-5":
        query = query.gte("rating", 4)
        break
      case "1-3":
        query = query.lte("rating", 3)
        break
    }
  }

  if (filters.search) {
    query = query.or(
      `review_text.ilike.%${filters.search}%,route_from.ilike.%${filters.search}%,route_to.ilike.%${filters.search}%`
    )
  }

  switch (filters.sortBy) {
    case "newest":
      query = query.order("created_at", { ascending: false })
      break
    case "oldest":
      query = query.order("created_at", { ascending: true })
      break
    case "highest":
      query = query.order("rating", { ascending: false })
      break
    case "lowest":
      query = query.order("rating", { ascending: true })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: reviews, error, count } = await query

  if (error) {
    return { data: null, error: "Failed to fetch reviews", total: 0, totalPages: 0 }
  }

  return {
    data: reviews,
    error: null,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    page,
  }
}

export async function getReviewStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("status, rating")
    .eq("customer_id", user.id)

  if (!reviews) {
    return { data: null, error: "Failed to fetch reviews" }
  }

  const total = reviews.length
  const pending = reviews.filter((r) => r.status === "pending").length
  const approved = reviews.filter((r) => r.status === "approved").length
  const averageRating = total > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
    : 0

  return { data: { total, pending, approved, averageRating }, error: null }
}

export async function getEligibleBookings() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, booking_number, pickup_address, dropoff_address, pickup_datetime,
      booking_status, vehicle_type_id, vehicle_types(name, image_url)
    `)
    .eq("customer_id", user.id)
    .eq("booking_status", "completed")
    .order("pickup_datetime", { ascending: false })

  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("booking_id")
    .eq("customer_id", user.id)

  const reviewedIds = new Set(existingReviews?.map((r) => r.booking_id) || [])
  const eligible = bookings?.filter((b) => !reviewedIds.has(b.id)) || []

  return { data: eligible, error: null }
}

export async function createReview(data: ReviewFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_id, booking_status, pickup_address, dropoff_address, vehicle_type_id")
    .eq("id", data.booking_id)
    .single()

  if (!booking || booking.customer_id !== user.id) {
    return { error: "Invalid booking" }
  }

  if (booking.booking_status !== "completed") {
    return { error: "Can only review completed bookings" }
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", data.booking_id)
    .single()

  if (existing) {
    return { error: "Already reviewed this booking" }
  }

  const { data: vehicleType } = await supabase
    .from("vehicle_types")
    .select("name")
    .eq("id", booking.vehicle_type_id)
    .single()

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: data.booking_id,
      customer_id: user.id,
      rating: data.rating,
      review_text: data.content,
      route_from: booking.pickup_address,
      route_to: booking.dropoff_address,
      vehicle_class: vehicleType?.name || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    return { error: "Failed to create review" }
  }

  revalidatePath("/account")
  return { data: review, error: null }
}

export async function updateReview(reviewId: string, data: Partial<ReviewFormData>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("customer_id, status")
    .eq("id", reviewId)
    .single()

  if (!review || review.customer_id !== user.id) {
    return { error: "Review not found" }
  }

  if (review.status !== "pending") {
    return { error: "Only pending reviews can be updated" }
  }

  const { error } = await supabase
    .from("reviews")
    .update({ rating: data.rating, review_text: data.content })
    .eq("id", reviewId)

  if (error) {
    return { error: "Failed to update review" }
  }

  revalidatePath("/account")
  return { error: null }
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("customer_id, status")
    .eq("id", reviewId)
    .single()

  if (!review || review.customer_id !== user.id) {
    return { error: "Review not found" }
  }

  if (review.status !== "pending") {
    return { error: "Only pending reviews can be deleted" }
  }

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId)

  if (error) {
    return { error: "Failed to delete review" }
  }

  revalidatePath("/account")
  return { error: null }
}
