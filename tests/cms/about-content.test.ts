/**
 * About page content: shipped defaults must validate and stay free of AI
 * punctuation and fleet/licence claims, and a bad row falls back per section.
 */
import { DEFAULT_ABOUT_CONTENT } from '@/lib/cms/templates/about/defaults'
import { parseAboutContent } from '@/lib/cms/templates/about/parse'
import { aboutContentSchema } from '@/lib/cms/templates/about/schema'
import { canChangePageStatus } from '@/lib/cms/types'

const BANNED = /[–—…‘’“”]/

describe('about content', () => {
  it('ships valid defaults without banned punctuation', () => {
    expect(aboutContentSchema.safeParse(DEFAULT_ABOUT_CONTENT).success).toBe(true)
    expect(JSON.stringify(DEFAULT_ABOUT_CONTENT)).not.toMatch(BANNED)
  })

  it('never claims a fleet or a licence as ours', () => {
    expect(JSON.stringify(DEFAULT_ABOUT_CONTENT)).not.toMatch(/our fleet|licen[cs]ed/i)
  })

  it('returns the defaults for an empty or malformed row', () => {
    expect(parseAboutContent(null)).toEqual(DEFAULT_ABOUT_CONTENT)
    expect(parseAboutContent([])).toEqual(DEFAULT_ABOUT_CONTENT)
  })

  it('falls back per section and merges partial edits', () => {
    const result = parseAboutContent({
      hero: { title: '' },
      steps: { title: 'Edited' },
      values: { items: [] },
      story: { image: 'javascript:alert(1)' },
      company: { legalName: 'Infinia Transfers L.L.C' },
      faq: { items: [] },
    })
    expect(result.hero).toEqual(DEFAULT_ABOUT_CONTENT.hero)
    expect(result.steps.title).toBe('Edited')
    expect(result.steps.items).toEqual(DEFAULT_ABOUT_CONTENT.steps.items)
    expect(result.values).toEqual(DEFAULT_ABOUT_CONTENT.values)
    expect(result.story).toEqual(DEFAULT_ABOUT_CONTENT.story)
    expect(result.company.legalName).toBe('Infinia Transfers L.L.C')
    expect(result.company.payments).toBe(DEFAULT_ABOUT_CONTENT.company.payments)
    expect(result.faq).toEqual(DEFAULT_ABOUT_CONTENT.faq)
  })

  it('drops the hero figures and places an older row still stores', () => {
    const result = parseAboutContent({
      hero: { figures: [{ label: 'Desk', value: '24/7' }], note: { text: 'Old', label: 'Go', href: '#x' } },
      places: { visible: true },
    })
    expect(result.hero).not.toHaveProperty('figures')
    expect(result.hero).not.toHaveProperty('note')
    expect(result).not.toHaveProperty('places')
  })

  it('ships owner-only company facts blank so the page hides them', () => {
    const { legalName, licence, licenceIssuer, founded, deskHours } = DEFAULT_ABOUT_CONTENT.company
    expect([legalName, licence, licenceIssuer, founded, deskHours]).toEqual(['', '', '', '', ''])
  })

  it('never repeats the unconfirmed 24/7 desk claim', () => {
    expect(JSON.stringify(DEFAULT_ABOUT_CONTENT)).not.toMatch(/24\/7/)
  })

  it('ignores the closing panel an older row still stores', () => {
    const result = parseAboutContent({ close: { title: 'Old', visible: true }, steps: { title: 'Kept' } })
    expect(result).not.toHaveProperty('close')
    expect(result.steps.title).toBe('Kept')
  })

  it('ships images that exist under public/', () => {
    const fs = jest.requireActual<typeof import('fs')>('fs')
    const paths = JSON.stringify(DEFAULT_ABOUT_CONTENT).match(/"\/[a-z/-]+\.(?:jpg|webp)"/g) ?? []
    expect(paths.length).toBeGreaterThan(0)
    for (const quoted of paths) {
      expect(fs.existsSync(`public${JSON.parse(quoted)}`)).toBe(true)
    }
  })

  it('has no publish toggle, like contact', () => {
    expect(canChangePageStatus({ kind: 'system', template: 'about' })).toBe(false)
  })
})
