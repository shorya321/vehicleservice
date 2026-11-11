import { hasRatings, reviewerDisplayName, type HomeReview, type ReviewStatsSummary } from './home-record'
import { DEV_SAMPLE_REVIEWS, type DevSampleReview } from './dev-sample-reviews'
import type { ReviewSortValue } from './filter-options'

/**
 * Dev-server fallback for the home record and /reviews. Every entry point
 * checks NODE_ENV and an empty database itself, so a production build or a
 * single real review always shows real data. See dev-sample-reviews.ts.
 */

const DEV_ENV = 'development'

function isDevEmpty(stats: ReviewStatsSummary, nodeEnv: string | undefined): boolean {
  return nodeEnv === DEV_ENV && !hasRatings(stats)
}

export function devSampleStats(): ReviewStatsSummary {
  const distribution: ReviewStatsSummary['distribution'] = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  const counted = DEV_SAMPLE_REVIEWS.reduce(
    (acc, r) => ({ ...acc, [r.rating]: acc[r.rating as keyof typeof acc] + 1 }),
    distribution
  )
  const sum = DEV_SAMPLE_REVIEWS.reduce((total, r) => total + r.rating, 0)
  const totalReviews = DEV_SAMPLE_REVIEWS.length
  return { totalReviews, averageRating: sum / totalReviews, distribution: counted }
}

// ---- Home record -----------------------------------------------------------

interface HomeRecordData {
  reviews: readonly HomeReview[]
  stats: ReviewStatsSummary
}

export interface PreviewedRecord extends HomeRecordData {
  isPreview: boolean
}

export function applyDevPreview(data: HomeRecordData, nodeEnv: string | undefined): PreviewedRecord {
  if (data.reviews.length > 0 || !isDevEmpty(data.stats, nodeEnv)) {
    return { ...data, isPreview: false }
  }
  const featured = DEV_SAMPLE_REVIEWS.filter((r) => r.is_featured)
  return { reviews: featured, stats: devSampleStats(), isPreview: true }
}

// ---- /reviews page ---------------------------------------------------------

export interface DevSampleFilters {
  page: number
  sortBy: ReviewSortValue
  rating?: number
  search?: string
  limit: number
}

/** The shape /reviews hands to ReviewCard, matching getApprovedReviews rows. */
export interface DevSampleCardReview extends DevSampleReview {
  status: 'approved'
  admin_response: null
  admin_response_at: null
  photos: null
  customer: { full_name: string; avatar_url: null }
}

export interface DevSamplePage {
  data: DevSampleCardReview[]
  total: number
  totalPages: number
  stats: ReviewStatsSummary
}

const SORTERS: Record<ReviewSortValue, (a: DevSampleReview, b: DevSampleReview) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  oldest: (a, b) => a.created_at.localeCompare(b.created_at),
  highest: (a, b) => b.rating - a.rating,
  lowest: (a, b) => a.rating - b.rating,
}

function matchesSearch(review: DevSampleReview, term: string): boolean {
  const needle = term.toLowerCase()
  return [review.review_text, review.route_from, review.route_to].some((field) =>
    field.toLowerCase().includes(needle)
  )
}

function toCardReview(review: DevSampleReview): DevSampleCardReview {
  return {
    ...review,
    status: 'approved',
    admin_response: null,
    admin_response_at: null,
    photos: null,
    customer: { full_name: reviewerDisplayName(review.reviewer_name), avatar_url: null },
  }
}

/**
 * Sample results for /reviews, filtered, sorted and paged the same way the
 * database query is. Null whenever real data should be shown instead.
 */
export function devSampleReviewsPage(
  filters: DevSampleFilters,
  realStats: ReviewStatsSummary | null | undefined,
  nodeEnv: string | undefined
): DevSamplePage | null {
  const stats = realStats ?? { totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
  if (!isDevEmpty(stats, nodeEnv)) return null

  const term = filters.search?.trim() ?? ''
  const matched = DEV_SAMPLE_REVIEWS.filter(
    (r) => (!filters.rating || r.rating >= filters.rating) && (!term || matchesSearch(r, term))
  )
  const sorted = [...matched].sort(SORTERS[filters.sortBy])
  const from = (filters.page - 1) * filters.limit

  return {
    data: sorted.slice(from, from + filters.limit).map(toCardReview),
    total: sorted.length,
    totalPages: Math.ceil(sorted.length / filters.limit),
    stats: devSampleStats(),
  }
}
