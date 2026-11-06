import { formatBookingDate } from '@/lib/utils/timezone'
import { isAdminEntered, reviewSourceLabel } from './sources'

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
  /** Vehicle class name copied from the booking, e.g. "Business Class". */
  vehicle_class?: string | null
  /** The reviewer's profile, used to look up a display name server-side. */
  customer_id?: string | null
  /** 'customer', or the channel an admin-entered review came from. */
  source?: string | null
  /** Name the admin typed, for admin-entered reviews only. */
  reviewer_name?: string | null
  created_at: string
}

/** One card in the home review grid. */
export interface HomeReviewCard {
  id: string
  rating: number
  text: string
  /** "Sara A.", or a neutral label when no name is on record. */
  name: string
  initials: string
  /** "Business Class · Dubai Intl (DXB) to Dubai Marina · March 2026" */
  meta: string
  /** "Verified trip", or where an admin-entered review came from ("Via WhatsApp"). */
  sourceLabel: string
}

/** Cards shown on the home page. Three fill one row at desktop width. */
export const HOME_CARD_LIMIT = 3
export const ANONYMOUS_REVIEWER = 'Verified traveller'

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

/**
 * Up to `limit` reviews with words in them: featured first, then the fallback
 * list, never the same review twice. Both lists arrive newest first.
 */
export function pickHomeReviews(
  featured: readonly HomeReview[],
  fallback: readonly HomeReview[],
  limit: number = HOME_CARD_LIMIT
): HomeReview[] {
  const seen = new Set<string>()
  const picked: HomeReview[] = []
  for (const review of [...featured, ...fallback]) {
    if (picked.length >= limit) break
    if (seen.has(review.id) || quoteText(review).length === 0) continue
    seen.add(review.id)
    picked.push(review)
  }
  return picked
}

/**
 * "Sara A." from "Sara Ahmed". A first name and an initial is all a public
 * card shows: never a full surname, never an email.
 */
export function reviewerDisplayName(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ANONYMOUS_REVIEWER
  const [first, ...rest] = parts
  const last = rest.length > 0 ? rest[rest.length - 1] : ''
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first
}

export function reviewerInitials(displayName: string): string {
  if (displayName === ANONYMOUS_REVIEWER) return ''
  return displayName
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .replace(/[^\p{L}]/gu, '')
    .slice(0, 2)
    .toUpperCase()
}

/** "Business Class · Dubai Intl (DXB) to Dubai Marina · March 2026" */
export function formatCardMeta(review: HomeReview): string {
  const vehicle = review.vehicle_class?.trim()
  return [vehicle, formatQuoteAttribution(review)].filter(Boolean).join(ATTRIBUTION_SEPARATOR)
}

export function buildHomeCards(
  reviews: readonly HomeReview[],
  names: ReadonlyMap<string, string>
): HomeReviewCard[] {
  return reviews.map((review) => {
    const fullName = isAdminEntered(review.source)
      ? review.reviewer_name
      : review.customer_id
        ? names.get(review.customer_id)
        : null
    const name = reviewerDisplayName(fullName)
    return {
      id: review.id,
      rating: review.rating,
      text: quoteText(review),
      name,
      initials: reviewerInitials(name),
      meta: formatCardMeta(review),
      sourceLabel: reviewSourceLabel(review.source),
    }
  })
}
