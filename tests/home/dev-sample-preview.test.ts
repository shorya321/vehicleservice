import { applyDevPreview, devSampleReviewsPage, devSampleStats } from '@/lib/reviews/dev-sample-preview'
import { DEV_SAMPLE_REVIEWS } from '@/lib/reviews/dev-sample-reviews'
import type { HomeReview, ReviewStatsSummary } from '@/lib/reviews/home-record'

const EMPTY: ReviewStatsSummary = { totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
const REAL_STATS: ReviewStatsSummary = { totalReviews: 1, averageRating: 4, distribution: { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0 } }
const REAL: HomeReview = { id: 'real', rating: 4, review_text: 'Real words.', route_from: 'A', route_to: 'B', created_at: '2026-05-01T08:00:00.000Z' }
const FILTERS = { page: 1, sortBy: 'newest' as const, limit: 12 }

describe('applyDevPreview', () => {
  it('never shows samples outside development', () => {
    expect(applyDevPreview({ reviews: [], stats: EMPTY }, 'production').isPreview).toBe(false)
    expect(applyDevPreview({ reviews: [], stats: EMPTY }, 'test').isPreview).toBe(false)
  })

  it('fills an empty dev record with the featured samples', () => {
    const out = applyDevPreview({ reviews: [], stats: EMPTY }, 'development')
    expect(out.isPreview).toBe(true)
    expect(out.reviews.map((r) => r.id)).toEqual(DEV_SAMPLE_REVIEWS.filter((r) => r.is_featured).map((r) => r.id))
  })

  it('lets real data win in development', () => {
    expect(applyDevPreview({ reviews: [REAL], stats: REAL_STATS }, 'development').reviews).toEqual([REAL])
    expect(applyDevPreview({ reviews: [], stats: REAL_STATS }, 'development').isPreview).toBe(false)
  })
})

describe('devSampleReviewsPage', () => {
  it('returns null in production or once a real review exists', () => {
    expect(devSampleReviewsPage(FILTERS, EMPTY, 'production')).toBeNull()
    expect(devSampleReviewsPage(FILTERS, REAL_STATS, 'development')).toBeNull()
  })

  it('lists all five samples, newest first, with public names', () => {
    const page = devSampleReviewsPage(FILTERS, EMPTY, 'development')
    expect(page?.total).toBe(5)
    expect(page?.totalPages).toBe(1)
    const dates = page?.data.map((r) => r.created_at) ?? []
    expect(dates).toEqual([...dates].sort().reverse())
    expect(page?.data[0].customer.full_name).toBe('Priya S.')
  })

  it('applies rating, search and paging like the database query', () => {
    expect(devSampleReviewsPage({ ...FILTERS, rating: 5 }, EMPTY, 'development')?.total).toBe(3)
    expect(devSampleReviewsPage({ ...FILTERS, search: 'sharjah' }, EMPTY, 'development')?.total).toBe(1)
    const paged = devSampleReviewsPage({ ...FILTERS, limit: 2, page: 3 }, EMPTY, 'development')
    expect(paged?.data).toHaveLength(1)
    expect(paged?.totalPages).toBe(3)
  })

  it('works when stats failed to load', () => {
    expect(devSampleReviewsPage(FILTERS, null, 'development')?.total).toBe(5)
  })
})

describe('devSampleStats', () => {
  it('agrees with the sample ratings', () => {
    const stats = devSampleStats()
    expect(stats.totalReviews).toBe(DEV_SAMPLE_REVIEWS.length)
    expect(Object.values(stats.distribution).reduce((a, b) => a + b, 0)).toBe(stats.totalReviews)
    expect(stats.averageRating).toBeCloseTo(23 / 5)
  })

  it('keeps sample copy free of dashes, ellipses and curly quotes', () => {
    DEV_SAMPLE_REVIEWS.forEach((r) => expect(r.review_text).not.toMatch(/[–—…‘’“”]/))
  })
})
