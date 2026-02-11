'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  adminResponseSchema,
  reviewFiltersSchema,
  type ReviewFilters,
  type AdminResponseData,
} from '@/lib/reviews/validation'

// Get all reviews with filters (admin only)
export async function getReviews(filters: ReviewFilters = {}) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated', total: 0, totalPages: 0 }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { data: null, error: 'Unauthorized', total: 0, totalPages: 0 }
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

// Approve a review
export async function approveReview(reviewId: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Update review status
    const { error } = await supabase
      .from('reviews')
      .update({ status: 'approved' })
      .eq('id', reviewId)

    if (error) {
      console.error('Approve review error:', error)
      return { error: 'Failed to approve review' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/reviews')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Approve review exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Reject a review
export async function rejectReview(reviewId: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Update review status
    const { error } = await supabase
      .from('reviews')
      .update({ status: 'rejected' })
      .eq('id', reviewId)

    if (error) {
      console.error('Reject review error:', error)
      return { error: 'Failed to reject review' }
    }

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error) {
    console.error('Reject review exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Toggle featured status
export async function toggleFeaturedReview(reviewId: string, featured: boolean) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Update featured status
    const { error } = await supabase
      .from('reviews')
      .update({ is_featured: featured })
      .eq('id', reviewId)

    if (error) {
      console.error('Toggle featured error:', error)
      return { error: 'Failed to update featured status' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Toggle featured exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Add admin response
export async function addAdminResponse(data: AdminResponseData) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Validate data
    const validatedData = adminResponseSchema.parse(data)

    // Update review with admin response
    const { error } = await supabase
      .from('reviews')
      .update({
        admin_response: validatedData.response,
        admin_response_at: new Date().toISOString(),
        admin_responder_id: user.id,
      })
      .eq('id', validatedData.reviewId)

    if (error) {
      console.error('Add admin response error:', error)
      return { error: 'Failed to add response' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Add admin response exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Bulk approve reviews
export async function bulkApproveReviews(reviewIds: string[]) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Update all reviews
    const { error } = await supabase
      .from('reviews')
      .update({ status: 'approved' })
      .in('id', reviewIds)

    if (error) {
      console.error('Bulk approve error:', error)
      return { error: 'Failed to approve reviews' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/reviews')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Bulk approve exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Bulk reject reviews
export async function bulkRejectReviews(reviewIds: string[]) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Update all reviews
    const { error } = await supabase
      .from('reviews')
      .update({ status: 'rejected' })
      .in('id', reviewIds)

    if (error) {
      console.error('Bulk reject error:', error)
      return { error: 'Failed to reject reviews' }
    }

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error) {
    console.error('Bulk reject exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Delete a review (admin only - can delete any review regardless of status or ownership)
export async function deleteReview(reviewId: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Delete review (admin can delete any review)
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('Delete review error:', error)
      return { error: 'Failed to delete review' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/account')
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Delete review exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Bulk delete reviews (admin only)
export async function bulkDeleteReviews(reviewIds: string[]) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Delete all reviews
    const { error } = await supabase
      .from('reviews')
      .delete()
      .in('id', reviewIds)

    if (error) {
      console.error('Bulk delete error:', error)
      return { error: 'Failed to delete reviews' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/account')
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Bulk delete exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get a single review by ID (admin only - can view any review)
export async function getReviewById(reviewId: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { data: null, error: 'Unauthorized' }
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

    // Admin can view any review (no ownership check)
    return { data: review, error: null }
  } catch (error) {
    console.error('Get review exception:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// Update admin response on a review
export async function updateAdminResponse(reviewId: string, response: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Update the admin response
    const { error } = await supabase
      .from('reviews')
      .update({
        admin_response: response,
        admin_response_at: new Date().toISOString(),
        admin_responder_id: user.id,
      })
      .eq('id', reviewId)

    if (error) {
      console.error('Update admin response error:', error)
      return { error: 'Failed to update response' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath(`/admin/reviews/${reviewId}`)
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Update admin response exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Delete admin response from a review
export async function deleteAdminResponse(reviewId: string) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    // Remove the admin response
    const { error } = await supabase
      .from('reviews')
      .update({
        admin_response: null,
        admin_response_at: null,
        admin_responder_id: null,
      })
      .eq('id', reviewId)

    if (error) {
      console.error('Delete admin response error:', error)
      return { error: 'Failed to delete response' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath(`/admin/reviews/${reviewId}`)
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Delete admin response exception:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get review statistics for admin dashboard
export async function getAdminReviewStats() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { data: null, error: 'Unauthorized' }
    }

    const { data: pendingCount } = await supabase.rpc('get_pending_reviews_count')

    const { data: stats } = await supabase.rpc('get_review_stats')
    const reviewStats = stats?.[0]

    return {
      data: {
        pending: pendingCount || 0,
        total: reviewStats?.total_reviews || 0,
        averageRating: reviewStats?.average_rating || 0,
      },
      error: null,
    }
  } catch (error) {
    console.error('Get admin stats exception:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
