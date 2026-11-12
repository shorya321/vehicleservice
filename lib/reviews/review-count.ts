import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ApprovedReviewSummary {
  count: number
  average: number
}

const NO_REVIEWS: ApprovedReviewSummary = { count: 0, average: 0 }

/**
 * Approved-review count and average, for above-the-fold decisions such as
 * whether the hero may show a rating and which figure it shows. Cached briefly
 * because the hero must not wait on the uncached review stats the testimonials
 * section streams in later. Moderation actions call revalidatePath('/'), which
 * also purges this entry. A failed read returns no reviews, which hides the
 * rating rather than showing a wrong one.
 */
export const getApprovedReviewSummary = unstable_cache(
  async (): Promise<ApprovedReviewSummary> => {
    try {
      const { data, error } = await createAdminClient().rpc('get_review_stats')
      if (error) {
        console.error('[reviews] Failed to read review stats:', error.message)
        return NO_REVIEWS
      }
      const row = data?.[0]
      return {
        count: Number(row?.total_reviews ?? 0),
        // Postgres numeric can arrive as a string; Number() covers both.
        average: Number(row?.average_rating ?? 0),
      }
    } catch (error: unknown) {
      console.error('[reviews] Unexpected error reading review stats:', error)
      return NO_REVIEWS
    }
  },
  ['approved-review-summary', 'v1'],
  { revalidate: 300, tags: ['reviews'] }
)
