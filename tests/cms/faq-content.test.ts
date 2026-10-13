/**
 * FAQ page content: shipped defaults validate and stay free of AI punctuation
 * and fleet/licence claims, a bad row falls back per section, and topic anchors
 * stay unique.
 */
import { DEFAULT_FAQ_CONTENT } from '@/lib/cms/templates/faq/defaults'
import { faqTopicIds, parseFaqContent } from '@/lib/cms/templates/faq/parse'
import { faqContentSchema } from '@/lib/cms/templates/faq/schema'
import { canChangePageStatus } from '@/lib/cms/types'

const BANNED = /[–—…‘’“”]/

describe('faq content', () => {
  it('ships valid defaults without banned punctuation', () => {
    expect(faqContentSchema.safeParse(DEFAULT_FAQ_CONTENT).success).toBe(true)
    expect(JSON.stringify(DEFAULT_FAQ_CONTENT)).not.toMatch(BANNED)
  })

  it('never claims a fleet or a licence as ours', () => {
    expect(JSON.stringify(DEFAULT_FAQ_CONTENT)).not.toMatch(/our fleet|licen[cs]ed/i)
  })

  it('returns the defaults for an empty or malformed row', () => {
    expect(parseFaqContent(null)).toEqual(DEFAULT_FAQ_CONTENT)
    expect(parseFaqContent([])).toEqual(DEFAULT_FAQ_CONTENT)
    expect(parseFaqContent({})).toEqual(DEFAULT_FAQ_CONTENT)
  })

  it('falls back per section and merges partial edits', () => {
    const result = parseFaqContent({
      hero: { title: 'Edited' },
      topics: [{ name: '', items: [] }],
      help: { title: '' },
    })
    expect(result.hero.title).toBe('Edited')
    expect(result.hero.body).toBe(DEFAULT_FAQ_CONTENT.hero.body)
    expect(result.topics).toEqual(DEFAULT_FAQ_CONTENT.topics)
    expect(result.help).toEqual(DEFAULT_FAQ_CONTENT.help)
  })

  it('takes a valid topics list whole instead of merging it with the defaults', () => {
    const topics = [{ name: 'Only', blurb: '', items: [{ question: 'Q?', answer: 'A.' }] }]
    expect(parseFaqContent({ topics }).topics).toEqual(topics)
  })

  it('builds unique, url-safe topic anchors', () => {
    expect(faqTopicIds([{ name: 'Pricing and payment' }, { name: 'Pricing & payment!' }, { name: '!!!' }])).toEqual([
      'pricing-and-payment',
      'pricing-payment',
      'topic',
    ])
    expect(faqTopicIds([{ name: 'Booking' }, { name: 'booking' }])).toEqual(['booking', 'booking-2'])
  })

  it('has no publish toggle, like about', () => {
    expect(canChangePageStatus({ kind: 'system', template: 'faq' })).toBe(false)
  })
})
