'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  reviewFormSchema,
  reviewFiltersSchema,
  type ReviewFormData,
  type ReviewFilters
} from '@/lib/reviews/validation'

// Create a new review
export async function createReview(data: ReviewFormData) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'You must be logged in to submit a review' }
    }

    // Validate form data
    const validatedData = reviewFormSchema.parse(data)

    // Check if booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, booking_status, pickup_address, dropoff_address, vehicle_type_id')
      .eq('id', validatedData.bookingId)
      .single()

    if (bookingError || !booking) {
      return { error: 'Booking not found' }
    }

    if (booking.customer_id !== user.id) {
      return { error: 'You can only review your own bookings' }
    }

    if (booking.booking_status !== 'completed') {
      return { error: 'You can only review completed bookings' }
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', validatedData.bookingId)
      .single()

    if (existingReview) {
      return { error: 'You have already reviewed this booking' }
    }

    // Get vehicle type name
    const { data: vehicleType } = await supabase
      .from('vehicle_types')
      .select('name')
      .eq('id', booking.vehicle_type_id)
      .single()

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert([
        {
          booking_id: validatedData.bookingId,
          customer_id: user.id,
          rating: validatedData.rating,
          review_text: validatedData.reviewText || null,
          photos: validatedData.photos || [],
          route_from: booking.pickup_address,
          route_to: booking.dropoff_address,
          vehicle_class: vehicleType?.name || null,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (reviewError) {
      console.error('Review creation error:', reviewError)
      return { error: 'Failed to create review' }
    }

    revalidatePath('/customer/reviews')
    revalidatePath('/')

    return { data: review, error: null }
  } catch (error) {
    console.error('Create review exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get customer's own reviews with filters
export async function getMyReviews(filters: ReviewFilters = {}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated', total: 0, totalPages: 0 }
    }

    // Validate filters
    const validatedFilters = reviewFiltersSchema.parse(filters)

    let query = supabase
      .from('reviews')
      .select(
        `
        *,
        customer:profiles!reviews_customer_id_fkey(full_name, email, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('customer_id', user.id)

    // Apply status filter
    if (validatedFilters.status && validatedFilters.status !== 'all') {
      query = query.eq('status', validatedFilters.status)
    }

    // Apply rating filter (legacy - for backward compatibility)
    if (validatedFilters.rating) {
      query = query.gte('rating', validatedFilters.rating)
    }

    // Apply rating range filter
    if (validatedFilters.ratingRange && validatedFilters.ratingRange !== 'all') {
      switch (validatedFilters.ratingRange) {
        case '5':
          query = query.eq('rating', 5)
          break
        case '4-5':
          query = query.gte('rating', 4)
          break
        case '1-3':
          query = query.lte('rating', 3)
          break
      }
    }

    // Apply search
    if (validatedFilters.search) {
      query = query.or(
        `review_text.ilike.%${validatedFilters.search}%,route_from.ilike.%${validatedFilters.search}%,route_to.ilike.%${validatedFilters.search}%`
      )
    }

    // Apply sorting
    switch (validatedFilters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'highest':
        query = query.order('rating', { ascending: false })
        break
      case 'lowest':
        query = query.order('rating', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const page = validatedFilters.page || 1
    const limit = validatedFilters.limit || 20
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Get reviews error:', error)
      return { data: null, error: 'Failed to fetch reviews', total: 0, totalPages: 0 }
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      data: reviews,
      error: null,
      total: count || 0,
      totalPages,
      page,
    }
  } catch (error) {
    console.error('Get reviews exception:', error)
    return { data: null, error: 'An unexpected error occurred', total: 0, totalPages: 0 }
  }
}

// Get eligible bookings (completed bookings without reviews)
export async function getEligibleBookings() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Get completed bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        booking_number,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        booking_status,
        vehicle_type_id,
        vehicle_types(name, image_url)
      `
      )
      .eq('customer_id', user.id)
      .eq('booking_status', 'completed')
      .order('pickup_datetime', { ascending: false })

    if (bookingsError) {
      return { data: null, error: 'Failed to fetch bookings' }
    }

    // Get existing reviews
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('customer_id', user.id)

    const reviewedBookingIds = new Set(
      existingReviews?.map((r) => r.booking_id) || []
    )

    // Filter out bookings that already have reviews
    const eligibleBookings = bookings?.filter(
      (booking) => !reviewedBookingIds.has(booking.id)
    )

    return { data: eligibleBookings || [], error: null }
  } catch (error) {
    console.error('Get eligible bookings exception:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// Update a pending review
export async function updateReview(reviewId: string, data: Partial<ReviewFormData>) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Check if review exists and belongs to user
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('customer_id, status')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return { error: 'Review not found' }
    }

    if (review.customer_id !== user.id) {
      return { error: 'You can only update your own reviews' }
    }

    if (review.status !== 'pending') {
      return { error: 'Only pending reviews can be updated' }
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        rating: data.rating,
        review_text: data.reviewText || null,
        photos: data.photos || [],
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      return { error: 'Failed to update review' }
    }

    revalidatePath('/customer/reviews')
    return { data: updatedReview, error: null }
  } catch (error) {
    console.error('Update review exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Delete a pending review
export async function deleteReview(reviewId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Check if review exists and belongs to user
    const { data: review } = await supabase
      .from('reviews')
      .select('customer_id, status')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return { error: 'Review not found' }
    }

    if (review.customer_id !== user.id) {
      return { error: 'You can only delete your own reviews' }
    }

    if (review.status !== 'pending') {
      return { error: 'Only pending reviews can be deleted' }
    }

    // Delete review
    const { error: deleteError } = await supabase.from('reviews').delete().eq('id', reviewId)

    if (deleteError) {
      return { error: 'Failed to delete review' }
    }

    revalidatePath('/customer/reviews')
    return { error: null }
  } catch (error) {
    console.error('Delete review exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get customer review statistics
export async function getCustomerReviewStats() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Get all customer reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('status, rating')
      .eq('customer_id', user.id)

    if (!reviews) {
      return { data: null, error: 'Failed to fetch reviews' }
    }

    const total = reviews.length
    const pending = reviews.filter(r => r.status === 'pending').length
    const approved = reviews.filter(r => r.status === 'approved').length
    const averageRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0

    return {
      data: {
        total,
        pending,
        approved,
        averageRating,
      },
      error: null,
    }
  } catch (error) {
    console.error('Get customer stats exception:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// Get a single review by ID
export async function getReviewById(reviewId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Fetch review with customer and booking data
    const { data: review, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        customer:profiles!reviews_customer_id_fkey(full_name, email, avatar_url),
        booking:bookings!reviews_booking_id_fkey(
          id,
          booking_number,
          pickup_address,
          dropoff_address,
          pickup_datetime,
          vehicle_type_id,
          vehicle_types(name, image_url)
        )
      `
      )
      .eq('id', reviewId)
      .single()

    if (error) {
      console.error('Get review error:', error)
      return { data: null, error: 'Review not found' }
    }

    if (!review) {
      return { data: null, error: 'Review not found' }
    }

    // Verify ownership
    if (review.customer_id !== user.id) {
      return { data: null, error: 'Unauthorized' }
    }

    return { data: review, error: null }
  } catch (error) {
    console.error('Get review exception:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

