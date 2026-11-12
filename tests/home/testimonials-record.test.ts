/**
 * The home review section renders from the `reviews` table only: up to three
 * review cards and no overall score. These pin the markup.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { TestimonialsRecord, type TestimonialsRecordProps } from '@/components/home/testimonials-record'
import { ANONYMOUS_REVIEWER, buildHomeCards, type HomeReview } from '@/lib/reviews/home-record'
import { DEFAULT_HOME_CONTENT } from '@/lib/cms/templates/home/defaults'

const REVIEW: HomeReview = {
  id: 'r1',
  rating: 5,
  review_text: 'The driver was waiting at arrivals.',
  route_from: 'Dubai Intl (DXB)',
  route_to: 'Palm Jumeirah',
  vehicle_class: 'Business Class',
  customer_id: 'c1',
  created_at: '2026-03-10T08:00:00.000Z',
}

const render = (props: Omit<TestimonialsRecordProps, 'content'>): string =>
  renderToStaticMarkup(jsx(TestimonialsRecord, { ...props, content: DEFAULT_HOME_CONTENT.testimonials }))

const SAMPLE_COPY = ['Rania', '1,284', 'completed transfers', '4.9', '[Sample]']

/** Icon path data carries arbitrary decimals ("...294.904..."), so drop it first. */
const withoutSvg = (html: string): string => html.replace(/<svg[\s\S]*?<\/svg>/g, '')

describe('TestimonialsRecord with reviews', () => {
  const cards = buildHomeCards([REVIEW], new Map([['c1', 'Sara Ahmed Khan']]))
  const html = render({ cards })

  it('prints no overall score box', () => {
    expect(html).not.toContain('record-score')
    expect(html).not.toContain('Average from')
  })

  it('renders one card per review with its rating and words, in straight quotes', () => {
    expect(html.match(/class="record-card"/g)).toHaveLength(1)
    expect(html).toContain('5 / 5')
    expect(html).toContain('&quot;The driver was waiting at arrivals.&quot;')
    expect(html).not.toMatch(/[\u201C\u201D\u2014\u2013]/)
  })

  it('names the reviewer by first name and last initial only', () => {
    expect(html).toContain('Sara K.')
    expect(html).not.toContain('Ahmed')
    expect(html).not.toContain('Khan')
    expect(html).toContain('>SK<')
  })

  it('shows vehicle, route and month', () => {
    expect(html).toContain('Business Class · Dubai Intl (DXB) to Palm Jumeirah · March 2026')
  })

  it('shows no source label and links to every review', () => {
    expect(html).not.toContain('record-card__source')
    expect(html).not.toContain('Verified trip')
    expect(html).toContain('href="/reviews"')
  })

  it('carries none of the design reference sample copy', () => {
    SAMPLE_COPY.forEach((sample) => expect(withoutSvg(html)).not.toContain(sample))
  })
})

describe('TestimonialsRecord edge cases', () => {
  it('shows a neutral label when no name is on record', () => {
    const html = render({ cards: buildHomeCards([{ ...REVIEW, customer_id: null }], new Map()) })
    expect(html).toContain(ANONYMOUS_REVIEWER)
  })

  it('prints no cards with nothing to show', () => {
    const html = render({ cards: [] })
    expect(html).not.toContain('record-card')
  })
})
