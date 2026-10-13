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
      places: { items: [{ name: 'Deira', note: '', image: 'javascript:alert(1)' }] },
    })
    expect(result.hero).toEqual(DEFAULT_ABOUT_CONTENT.hero)
    expect(result.steps.title).toBe('Edited')
    expect(result.steps.items).toEqual(DEFAULT_ABOUT_CONTENT.steps.items)
    expect(result.values).toEqual(DEFAULT_ABOUT_CONTENT.values)
    expect(result.places).toEqual(DEFAULT_ABOUT_CONTENT.places)
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
