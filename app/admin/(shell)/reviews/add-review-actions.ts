'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminReviewSchema, type AdminReviewInput } from '@/lib/reviews/admin-review-schema'
import { bookingToday, bookingWallClockToUtc } from '@/lib/utils/timezone'

type AddReviewResult = { success: true; id: string } | { success: false; error: string }

/**
 * Adds a review an admin typed in from feedback received outside the site.
 * Runs on the admin's own session, so the database's "Admins can add reviews"
 * policy is the final check, not only the role lookup here.
 */
export async function createAdminReview(input: AdminReviewInput): Promise<AddReviewResult> {
  try {
    const parsed = adminReviewSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Check the form and try again' }
    }
    const data = parsed.data

    if (data.reviewDate > bookingToday()) {
      return { success: false, error: 'The review date cannot be in the future' }
    }
    // Featuring an unpublished review would do nothing on the site; refuse rather than surprise.
    if (data.isFeatured && !data.publish) {
      return { success: false, error: 'Publish the review to feature it on the homepage' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { success: false, error: 'Unauthorized' }

    // Midday in the operating timezone, so the month shown on the card never
    // slips to a neighbouring day.
    const createdAt = bookingWallClockToUtc(data.reviewDate, '12:00').toISOString()

    const { data: row, error } = await supabase
      .from('reviews')
      .insert({
        source: data.source,
        reviewer_name: data.reviewerName,
        rating: data.rating,
        review_text: data.reviewText,
        vehicle_class: data.vehicleClass,
        route_from: data.routeFrom,
        route_to: data.routeTo,
        status: data.publish ? 'approved' : 'pending',
        is_featured: data.isFeatured,
        added_by: user.id,
        created_at: createdAt,
      })
      .select('id')
      .single()

    if (error || !row) {
      console.error('[Reviews] Add review error:', error)
      return { success: false, error: 'Could not save the review. Please try again.' }
    }

    // The hero rating and the review count are cached under this tag.
    updateTag('reviews')
    revalidatePath('/admin/reviews')
    revalidatePath('/reviews')
    revalidatePath('/')

    return { success: true, id: row.id }
  } catch (error) {
    console.error('[Reviews] Add review exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
