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

export const PREVIEW_QUOTE: HomeReview = {
  id: 'dev-preview',
  rating: 5,
  review_text:
    'The flight landed two hours late at one in the morning and the car was still there. Nobody asked me for another dirham.',
  route_from: 'Dubai Intl (DXB)',
  route_to: 'Abu Dhabi Corniche',
  created_at: '2026-03-14T06:00:00.000Z',
}

export const PREVIEW_STATS: ReviewStatsSummary = {
  totalReviews: 128,
  averageRating: 4.9,
  distribution: { 5: 118, 4: 8, 3: 1, 2: 1, 1: 0 },
}

interface HomeRecordData {
  quote: HomeReview | null
  stats: ReviewStatsSummary
}

export interface PreviewedRecord extends HomeRecordData {
  isPreview: boolean
}

export function applyDevPreview(
  data: HomeRecordData,
  nodeEnv: string | undefined
): PreviewedRecord {
  const isEmpty = data.quote === null && !hasRatings(data.stats)
  if (nodeEnv !== 'development' || !isEmpty) {
    return { ...data, isPreview: false }
  }
  return { quote: PREVIEW_QUOTE, stats: PREVIEW_STATS, isPreview: true }
}
