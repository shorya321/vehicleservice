import { applyDevPreview, PREVIEW_QUOTE, PREVIEW_STATS } from '@/lib/reviews/home-record-preview'
import type { HomeReview, ReviewStatsSummary } from '@/lib/reviews/home-record'

const EMPTY: ReviewStatsSummary = {
  totalReviews: 0,
  averageRating: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
}

const REAL_QUOTE: HomeReview = {
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
    const out = applyDevPreview({ quote: null, stats: EMPTY }, 'production')
    expect(out.quote).toBeNull()
    expect(out.stats).toBe(EMPTY)
    expect(out.isPreview).toBe(false)
  })

  it('never shows the sample under test', () => {
    expect(applyDevPreview({ quote: null, stats: EMPTY }, 'test').isPreview).toBe(false)
  })

  it('shows the sample in development when the record is empty', () => {
    const out = applyDevPreview({ quote: null, stats: EMPTY }, 'development')
    expect(out.isPreview).toBe(true)
    expect(out.quote).toBe(PREVIEW_QUOTE)
    expect(out.stats).toBe(PREVIEW_STATS)
  })

  it('lets real reviews win in development', () => {
    const out = applyDevPreview({ quote: REAL_QUOTE, stats: REAL_STATS }, 'development')
    expect(out.isPreview).toBe(false)
    expect(out.quote).toBe(REAL_QUOTE)
  })

  it('keeps real ratings even with no quotable text', () => {
    const out = applyDevPreview({ quote: null, stats: REAL_STATS }, 'development')
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
})
