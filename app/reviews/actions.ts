'use server'

import { createClient } from '@/lib/supabase/server'
import { reviewFiltersSchema, type ReviewFilters } from '@/lib/reviews/validation'

// Get all approved reviews with filters
export async function getApprovedReviews(filters: ReviewFilters = {}) {
  try {
    const supabase = await createClient()

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
      .eq('status', 'approved')

    // Apply rating filter
    if (validatedFilters.rating) {
      query = query.gte('rating', validatedFilters.rating)
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
      console.error('Get approved reviews error:', error)
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
    console.error('Get approved reviews exception:', error)
    return { data: null, error: 'An unexpected error occurred', total: 0, totalPages: 0 }
  }
}

// Get featured reviews
export async function getFeaturedReviews() {
  try {
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        customer:profiles!reviews_customer_id_fkey(full_name, email, avatar_url)
      `
      )
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Get featured reviews error:', error)
      return { data: null, error: 'Failed to fetch featured reviews' }
    }

    return { data: reviews, error: null }
  } catch (error) {
    console.error('Get featured reviews exception:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// Get review statistics
export async function getReviewStats() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_review_stats')

    if (error) {
      console.error('Get review stats error:', error)
      return {
        data: {
          totalReviews: 0,
          averageRating: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
        error: 'Failed to fetch review statistics',
      }
    }

    const stats = data?.[0]

    return {
      data: {
        totalReviews: stats?.total_reviews || 0,
        averageRating: stats?.average_rating || 0,
        distribution: {
          5: stats?.rating_5_count || 0,
          4: stats?.rating_4_count || 0,
          3: stats?.rating_3_count || 0,
          2: stats?.rating_2_count || 0,
          1: stats?.rating_1_count || 0,
        },
      },
      error: null,
    }
  } catch (error) {
    console.error('Get review stats exception:', error)
    return {
      data: {
        totalReviews: 0,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      error: 'An unexpected error occurred',
    }
  }
}
