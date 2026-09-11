import { formatBookingDate } from '@/lib/utils/timezone'

/**
 * View logic for the home page "Travellers on record" section.
 *
 * Kept free of React and Supabase so both the populated and the empty record
 * can be pinned by plain unit tests. Every figure here comes from the
 * `reviews` table: nothing is invented to fill the section when it is empty.
 */

/** The columns of a `reviews` row the section actually reads. */
export interface HomeReview {
  id: string
  rating: number
  review_text: string | null
  route_from: string | null
  route_to: string | null
  created_at: string
}

type Stars = 5 | 4 | 3 | 2 | 1

/** Shape returned by getReviewStats() in app/reviews/actions.ts. */
export interface ReviewStatsSummary {
  totalReviews: number
  averageRating: number
  distribution: Record<Stars, number>
}

export interface RatingRow {
  stars: Stars
  count: number
  percent: number
}

const STAR_ORDER: readonly Stars[] = [5, 4, 3, 2, 1]
const ATTRIBUTION_SEPARATOR = ' · '
const ATTRIBUTION_MONTH_PATTERN = 'MMMM yyyy'

export function quoteText(review: HomeReview): string {
  return (review.review_text ?? '').trim()
}

/**
 * The first featured review with words in it, else the first fallback review
 * with words in it. Callers pass lists already in display order, so "first"
 * means "newest" for both.
 */
export function pickHomeQuote(
  featured: readonly HomeReview[],
  fallback: readonly HomeReview[]
): HomeReview | null {
  const hasText = (r: HomeReview): boolean => quoteText(r).length > 0
  return featured.find(hasText) ?? fallback.find(hasText) ?? null
}

/**
 * "Dubai Intl (DXB) to Palm Jumeirah · March 2026". The month is read in the
 * operating timezone, so a review left at 01:30 on the 1st in Dubai is not
 * filed under the previous month. No name: anonymous visitors cannot read
 * profiles, so a name would show for some visitors and not others.
 */
export function formatQuoteAttribution(review: HomeReview): string {
  const from = review.route_from?.trim()
  const to = review.route_to?.trim()
  const route = from && to ? `${from} to ${to}` : null
  const month = formatBookingDate(review.created_at, ATTRIBUTION_MONTH_PATTERN)
  return [route, month].filter(Boolean).join(ATTRIBUTION_SEPARATOR)
}

export function buildRatingRows(stats: ReviewStatsSummary): RatingRow[] {
  const total = stats.totalReviews
  return STAR_ORDER.map((stars) => {
    const count = stats.distribution[stars] ?? 0
    const percent = total > 0 ? Math.round((count / total) * 100) : 0
    return { stars, count, percent }
  })
}

export function hasRatings(stats: ReviewStatsSummary): boolean {
  return stats.totalReviews > 0
}

/** Postgres numeric can arrive as a string; Number() covers both. */
export function formatAverage(average: number): string {
  return Number(average).toFixed(1)
}
