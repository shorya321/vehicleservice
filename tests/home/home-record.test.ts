import {
  ANONYMOUS_REVIEWER,
  buildRatingRows,
  formatCardMeta,
  pickHomeReviews,
  reviewerDisplayName,
  reviewerInitials,
  formatAverage,
  formatQuoteAttribution,
  hasRatings,
  pickHomeQuote,
  quoteText,
  type HomeReview,
  type ReviewStatsSummary,
} from '@/lib/reviews/home-record'

function review(partial: Partial<HomeReview> & Pick<HomeReview, 'id'>): HomeReview {
  return {
    rating: 5,
    review_text: 'On time and courteous.',
    route_from: 'Dubai Intl (DXB)',
    route_to: 'Palm Jumeirah',
    created_at: '2026-03-10T08:00:00.000Z',
    ...partial,
  }
}

function stats(
  distribution: ReviewStatsSummary['distribution'],
  averageRating = 0
): ReviewStatsSummary {
  const totalReviews = Object.values(distribution).reduce((sum, n) => sum + n, 0)
  return { totalReviews, averageRating, distribution }
}

const EMPTY = stats({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

describe('quoteText', () => {
  it('trims surrounding whitespace', () => {
    expect(quoteText(review({ id: 'a', review_text: '  Great.  ' }))).toBe('Great.')
  })

  it('treats null as empty', () => {
    expect(quoteText(review({ id: 'a', review_text: null }))).toBe('')
  })
})

describe('pickHomeQuote', () => {
  it('returns null when both lists are empty', () => {
    expect(pickHomeQuote([], [])).toBeNull()
  })

  it('prefers the first featured review that has text', () => {
    const featured = [
      review({ id: 'f1', review_text: '   ' }),
      review({ id: 'f2', review_text: null }),
      review({ id: 'f3' }),
    ]
    const fallback = [review({ id: 'b1' })]
    expect(pickHomeQuote(featured, fallback)?.id).toBe('f3')
  })

  it('falls back when no featured review has text', () => {
    const featured = [review({ id: 'f1', review_text: '' })]
    const fallback = [review({ id: 'b1', review_text: ' ' }), review({ id: 'b2' })]
    expect(pickHomeQuote(featured, fallback)?.id).toBe('b2')
  })

  it('returns null when no review anywhere has text', () => {
    expect(
      pickHomeQuote([review({ id: 'f1', review_text: null })], [review({ id: 'b1', review_text: '' })])
    ).toBeNull()
  })
})

describe('formatQuoteAttribution', () => {
  it('joins the route pair and the month', () => {
    expect(formatQuoteAttribution(review({ id: 'a' }))).toBe(
      'Dubai Intl (DXB) to Palm Jumeirah · March 2026'
    )
  })

  it('reads the month in the operating timezone, not UTC', () => {
    // 21:30 UTC on 31 March is 01:30 on 1 April in Dubai.
    const edge = review({ id: 'a', created_at: '2026-03-31T21:30:00.000Z' })
    expect(formatQuoteAttribution(edge)).toBe('Dubai Intl (DXB) to Palm Jumeirah · April 2026')
  })

  it('shows the month alone when either route end is missing', () => {
    expect(formatQuoteAttribution(review({ id: 'a', route_to: null }))).toBe('March 2026')
    expect(formatQuoteAttribution(review({ id: 'a', route_from: '  ' }))).toBe('March 2026')
  })
})

describe('buildRatingRows', () => {
  it('lists five rows from five stars down to one', () => {
    expect(buildRatingRows(EMPTY).map((r) => r.stars)).toEqual([5, 4, 3, 2, 1])
  })

  it('reports zero percent everywhere when there are no reviews', () => {
    expect(buildRatingRows(EMPTY).every((r) => r.count === 0 && r.percent === 0)).toBe(true)
  })

  it('rounds each share to a whole percent', () => {
    const rows = buildRatingRows(stats({ 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 }))
    expect(rows.map((r) => r.percent)).toEqual([67, 33, 0, 0, 0])
  })

  it('gives all-five-star records a full top bar', () => {
    const rows = buildRatingRows(stats({ 5: 4, 4: 0, 3: 0, 2: 0, 1: 0 }))
    expect(rows[0]).toEqual({ stars: 5, count: 4, percent: 100 })
  })
})

describe('hasRatings and formatAverage', () => {
  it('is false for an empty record', () => {
    expect(hasRatings(EMPTY)).toBe(false)
  })

  it('is true once one review exists', () => {
    expect(hasRatings(stats({ 5: 0, 4: 1, 3: 0, 2: 0, 1: 0 }, 4))).toBe(true)
  })

  it('formats the average to one decimal place', () => {
    expect(formatAverage(4.86)).toBe('4.9')
    expect(formatAverage(5)).toBe('5.0')
  })
})

describe('pickHomeReviews', () => {
  const r = (id: string, text: string | null): HomeReview => ({
    id,
    rating: 5,
    review_text: text,
    route_from: null,
    route_to: null,
    created_at: '2026-03-10T08:00:00.000Z',
  })

  it('takes featured first, then fills from the fallback, up to three', () => {
    const picked = pickHomeReviews([r('f1', 'a'), r('f2', 'b')], [r('x1', 'c'), r('x2', 'd')])
    expect(picked.map((p) => p.id)).toEqual(['f1', 'f2', 'x1'])
  })

  it('never repeats a review that is both featured and in the fallback', () => {
    const picked = pickHomeReviews([r('f1', 'a')], [r('f1', 'a'), r('x1', 'b')])
    expect(picked.map((p) => p.id)).toEqual(['f1', 'x1'])
  })

  it('skips reviews with no words', () => {
    expect(pickHomeReviews([r('f1', '  '), r('f2', null)], [r('x1', 'ok')]).map((p) => p.id)).toEqual(['x1'])
  })

  it('returns nothing from nothing', () => {
    expect(pickHomeReviews([], [])).toEqual([])
  })
})

describe('reviewerDisplayName and reviewerInitials', () => {
  it('shortens to first name and last initial', () => {
    expect(reviewerDisplayName('Sara Ahmed Khan')).toBe('Sara K.')
    expect(reviewerDisplayName('  noor   ali ')).toBe('noor A.')
  })

  it('keeps a single name whole', () => {
    expect(reviewerDisplayName('Priya')).toBe('Priya')
  })

  it('falls back to a neutral label', () => {
    expect(reviewerDisplayName('')).toBe(ANONYMOUS_REVIEWER)
    expect(reviewerDisplayName(null)).toBe(ANONYMOUS_REVIEWER)
  })

  it('builds initials, none for the neutral label', () => {
    expect(reviewerInitials('Sara K.')).toBe('SK')
    expect(reviewerInitials('Priya')).toBe('P')
    expect(reviewerInitials(ANONYMOUS_REVIEWER)).toBe('')
  })
})

describe('formatCardMeta', () => {
  it('leads with the vehicle class when there is one', () => {
    const base: HomeReview = {
      id: 'm',
      rating: 5,
      review_text: 'x',
      route_from: 'Dubai Intl (DXB)',
      route_to: 'Palm Jumeirah',
      created_at: '2026-03-10T08:00:00.000Z',
    }
    expect(formatCardMeta({ ...base, vehicle_class: 'Van' })).toBe('Van · Dubai Intl (DXB) to Palm Jumeirah · March 2026')
    expect(formatCardMeta(base)).toBe('Dubai Intl (DXB) to Palm Jumeirah · March 2026')
  })
})
