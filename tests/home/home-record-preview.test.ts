import { applyDevPreview, PREVIEW_REVIEWS, PREVIEW_STATS } from '@/lib/reviews/home-record-preview'
import type { HomeReview, ReviewStatsSummary } from '@/lib/reviews/home-record'

const EMPTY: ReviewStatsSummary = {
  totalReviews: 0,
  averageRating: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
}

const REAL: HomeReview = {
  id: 'real',
  rating: 4,
  review_text: 'Real words.',
  route_from: 'A',
  route_to: 'B',
  created_at: '2026-05-01T08:00:00.000Z',
}

const REAL_STATS: ReviewStatsSummary = {
  totalReviews: 1,
  averageRating: 4,
  distribution: { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0 },
}

describe('applyDevPreview', () => {
  it('never shows the sample in production', () => {
    const out = applyDevPreview({ reviews: [], stats: EMPTY }, 'production')
    expect(out.reviews).toEqual([])
    expect(out.stats).toBe(EMPTY)
    expect(out.isPreview).toBe(false)
  })

  it('never shows the sample under test', () => {
    expect(applyDevPreview({ reviews: [], stats: EMPTY }, 'test').isPreview).toBe(false)
  })

  it('shows three sample reviews in development when there are none', () => {
    const out = applyDevPreview({ reviews: [], stats: EMPTY }, 'development')
    expect(out.isPreview).toBe(true)
    expect(out.reviews).toBe(PREVIEW_REVIEWS)
    expect(out.reviews).toHaveLength(3)
    expect(out.stats).toBe(PREVIEW_STATS)
  })

  it('lets real reviews win in development', () => {
    const out = applyDevPreview({ reviews: [REAL], stats: REAL_STATS }, 'development')
    expect(out.isPreview).toBe(false)
    expect(out.reviews).toEqual([REAL])
  })

  it('keeps real ratings even with no quotable text', () => {
    const out = applyDevPreview({ reviews: [], stats: REAL_STATS }, 'development')
    expect(out.isPreview).toBe(false)
    expect(out.stats).toBe(REAL_STATS)
  })

  it('has sample stats that add up', () => {
    const sum = Object.values(PREVIEW_STATS.distribution).reduce((a, b) => a + b, 0)
    expect(sum).toBe(PREVIEW_STATS.totalReviews)
    const weighted = Object.entries(PREVIEW_STATS.distribution).reduce(
      (a, [stars, n]) => a + Number(stars) * n,
      0
    )
    expect((weighted / sum).toFixed(1)).toBe(PREVIEW_STATS.averageRating.toFixed(1))
  })

  it('gives sample reviews no profile, so no real name can attach to them', () => {
    PREVIEW_REVIEWS.forEach((review) => expect(review.customer_id).toBeUndefined())
  })
})
