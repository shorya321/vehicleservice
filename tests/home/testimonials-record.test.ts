/**
 * The home review section renders from the `reviews` table only. These pin
 * both states as markup: the empty record must read as empty, and the filled
 * one must carry the review's own words, not sample copy from the design
 * reference ("4.9", "1,284 completed transfers", "Rania K.").
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { TestimonialsRecord, type TestimonialsRecordProps } from '@/components/home/testimonials-record'
import {
  buildRatingRows,
  formatQuoteAttribution,
  type HomeReview,
  type ReviewStatsSummary,
} from '@/lib/reviews/home-record'

const EMPTY_STATS: ReviewStatsSummary = {
  totalReviews: 0,
  averageRating: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
}

const FILLED_STATS: ReviewStatsSummary = {
  totalReviews: 3,
  averageRating: 4.67,
  distribution: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 },
}

const QUOTE: HomeReview = {
  id: 'r1',
  rating: 5,
  review_text: 'The driver was waiting at arrivals.',
  route_from: 'Dubai Intl (DXB)',
  route_to: 'Palm Jumeirah',
  created_at: '2026-03-10T08:00:00.000Z',
}

const render = (props: TestimonialsRecordProps): string =>
  renderToStaticMarkup(jsx(TestimonialsRecord, props))

const SAMPLE_COPY = ['Rania', '1,284', 'completed transfers', '4.9']

/** Icon path data carries arbitrary decimals ("...294.904..."), so drop it first. */
const withoutSvg = (html: string): string => html.replace(/<svg[\s\S]*?<\/svg>/g, '')

describe('TestimonialsRecord, empty record', () => {
  const html = render({
    quote: null,
    attribution: null,
    stats: EMPTY_STATS,
    rows: buildRatingRows(EMPTY_STATS),
  })

  it('says there are no ratings instead of printing a score', () => {
    expect(html).toContain('No ratings yet')
    expect(html).not.toContain('record-score__avg')
  })

  it('shows the open ledger line and no blockquote', () => {
    expect(html).toContain('Awaiting first entry.')
    expect(html).not.toContain('<blockquote')
  })

  it('draws five empty bars', () => {
    expect(html.match(/class="record-bar"/g)).toHaveLength(5)
    expect(html.match(/width:0%/g)).toHaveLength(5)
  })

  it('still links to the reviews page', () => {
    expect(html).toContain('href="/reviews"')
  })

  it('carries none of the design reference sample copy', () => {
    SAMPLE_COPY.forEach((sample) => expect(withoutSvg(html)).not.toContain(sample))
  })
})

describe('TestimonialsRecord, filled record', () => {
  const html = render({
    quote: QUOTE,
    attribution: formatQuoteAttribution(QUOTE),
    stats: FILLED_STATS,
    rows: buildRatingRows(FILLED_STATS),
  })

  it('prints the real average and count', () => {
    expect(html).toContain('4.7')
    expect(html).toContain('from 3 reviews')
  })

  it('quotes the review in straight quotes', () => {
    expect(html).toContain('&quot;The driver was waiting at arrivals.&quot;')
    expect(html).not.toMatch(/[\u201C\u201D\u2014\u2013]/)
  })

  it('attributes by route and month', () => {
    expect(html).toContain('Dubai Intl (DXB) to Palm Jumeirah · March 2026')
  })

  it('sizes the bars from the distribution', () => {
    expect(html).toContain('width:67%')
    expect(html).toContain('width:33%')
  })

  it('says "review" for a single review', () => {
    const one: ReviewStatsSummary = { ...FILLED_STATS, totalReviews: 1, distribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 } }
    const single = render({ quote: QUOTE, attribution: null, stats: one, rows: buildRatingRows(one) })
    expect(single).toContain('from 1 review<')
  })
})
