import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Number of approved reviews, for above-the-fold decisions such as whether the
 * hero may show a rating. Cached briefly because the hero must not wait on the
 * uncached review stats the testimonials section streams in later. Moderation
 * actions call revalidatePath('/'), which also purges this entry.
 */
export const getApprovedReviewCount = unstable_cache(
  async (): Promise<number> => {
    try {
      const { data, error } = await createAdminClient().rpc('get_review_stats')
      if (error) {
        console.error('[reviews] Failed to count reviews:', error.message)
        return 0
      }
      return Number(data?.[0]?.total_reviews ?? 0)
    } catch (error: unknown) {
      console.error('[reviews] Unexpected error counting reviews:', error)
      return 0
    }
  },
  ['approved-review-count', 'v1'],
  { revalidate: 300, tags: ['reviews'] }
)
