import { hasRatings, type HomeReview, type ReviewStatsSummary } from './home-record'

/**
 * DEVELOPMENT-ONLY sample for the home "Travellers on record" section.
 *
 * The reviews table is empty, which leaves the section in its empty state.
 * This lets local design work see the populated layout. It is sample copy,
 * not a customer review, and must never be shown to real visitors:
 *
 * - it renders only when NODE_ENV is 'development' (`next build` and
 *   `next start` run as 'production', so Vercel and Coolify never show it);
 * - real reviews always win, even in development.
 *
 * Do not widen this gate or seed these values into the database.
 */

export const PREVIEW_REVIEWS: readonly HomeReview[] = [
  {
    id: 'dev-preview-1',
    rating: 5,
    review_text:
      'Booked a late pickup for my parents. Their flight was delayed almost two hours but the driver waited, kept me updated on WhatsApp and helped with the bags. Clean car, cold water, fair price.',
    route_from: 'Dubai Intl (DXB)',
    route_to: 'Dubai Marina',
    vehicle_class: 'Business Class',
    created_at: '2026-03-14T06:00:00.000Z',
  },
  {
    id: 'dev-preview-2',
    rating: 4,
    review_text:
      'Seven of us with a lot of luggage and the van fit everything. Pickup was a few minutes late, but the driver messaged ahead so we knew where to wait.',
    route_from: 'Downtown Dubai',
    route_to: 'Dubai World Central (DWC)',
    vehicle_class: 'Van',
    created_at: '2026-02-08T06:00:00.000Z',
  },
  {
    id: 'dev-preview-3',
    rating: 5,
    review_text:
      'Early morning airport run. Quiet, calm driver, the car was spotless and he walked my parents to the check-in desk.',
    route_from: 'Palm Jumeirah',
    route_to: 'Dubai Intl (DXB)',
    vehicle_class: 'First Class',
    created_at: '2026-01-20T06:00:00.000Z',
  },
]

export const PREVIEW_STATS: ReviewStatsSummary = {
  totalReviews: 128,
  averageRating: 4.9,
  distribution: { 5: 118, 4: 8, 3: 1, 2: 1, 1: 0 },
}

interface HomeRecordData {
  reviews: readonly HomeReview[]
  stats: ReviewStatsSummary
}

export interface PreviewedRecord extends HomeRecordData {
  isPreview: boolean
}

export function applyDevPreview(
  data: HomeRecordData,
  nodeEnv: string | undefined
): PreviewedRecord {
  const isEmpty = data.reviews.length === 0 && !hasRatings(data.stats)
  if (nodeEnv !== 'development' || !isEmpty) {
    return { ...data, isPreview: false }
  }
  return { reviews: PREVIEW_REVIEWS, stats: PREVIEW_STATS, isPreview: true }
}
