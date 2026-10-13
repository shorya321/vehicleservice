/**
 * Shared closing panel (Blog, About, FAQ): shipped defaults validate and stay
 * free of AI punctuation and fleet claims, and a bad row never blanks the panel.
 */
import { DEFAULT_CLOSING_PANEL } from '@/lib/cms/blocks/closing-panel/defaults'
import { parseClosingPanel } from '@/lib/cms/blocks/closing-panel/parse'
import { closingPanelSchema } from '@/lib/cms/blocks/closing-panel/schema'

const BANNED = /[–—…‘’“”]/

describe('closing panel content', () => {
  it('ships valid defaults without banned punctuation', () => {
    expect(closingPanelSchema.safeParse(DEFAULT_CLOSING_PANEL).success).toBe(true)
    expect(JSON.stringify(DEFAULT_CLOSING_PANEL)).not.toMatch(BANNED)
  })

  it('never claims a fleet or a licence as ours', () => {
    expect(JSON.stringify(DEFAULT_CLOSING_PANEL)).not.toMatch(/our fleet|licen[cs]ed/i)
  })

  it('returns the defaults for an empty or malformed row', () => {
    expect(parseClosingPanel(null)).toEqual(DEFAULT_CLOSING_PANEL)
    expect(parseClosingPanel([])).toEqual(DEFAULT_CLOSING_PANEL)
    expect(parseClosingPanel({})).toEqual(DEFAULT_CLOSING_PANEL)
  })

  it('merges a partial edit over the defaults', () => {
    const result = parseClosingPanel({ title: 'Edited', visible: false })
    expect(result.title).toBe('Edited')
    expect(result.visible).toBe(false)
    expect(result.primary).toEqual(DEFAULT_CLOSING_PANEL.primary)
  })

  it('falls back whole when a stored field is invalid', () => {
    expect(parseClosingPanel({ title: '' })).toEqual(DEFAULT_CLOSING_PANEL)
    expect(parseClosingPanel({ images: ['javascript:alert(1)', '/a.jpg'] })).toEqual(DEFAULT_CLOSING_PANEL)
    expect(parseClosingPanel({ primary: { label: 'Go', href: 'javascript:alert(1)' } })).toEqual(DEFAULT_CLOSING_PANEL)
  })

  it('ships images that exist under public/', () => {
    const fs = jest.requireActual<typeof import('fs')>('fs')
    for (const src of DEFAULT_CLOSING_PANEL.images) {
      expect(fs.existsSync(`public${src}`)).toBe(true)
    }
  })
})
