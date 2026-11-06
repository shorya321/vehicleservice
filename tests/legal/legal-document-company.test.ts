/**
 * Terms and Privacy show a "Company details" block from Settings > General, and only
 * once a legal name or licence is set. Until then the page is exactly as before.
 */
// isomorphic-dompurify pulls in jsdom, which jest cannot load here. The block under
// test is plain JSX, so pass section HTML through untouched.
jest.mock('@/lib/cms/sanitize', () => ({ sanitizeRichText: (html: string) => html }))
// The real contents list is a client component; a plain list of links is enough here.
jest.mock('@/components/legal/table-of-contents', () => {
  const { createElement } = jest.requireActual('react')
  return {
    TableOfContents: ({ sections }: { sections: Array<{ id: string; title: string }> }) =>
      createElement('nav', null, sections.map((s) => createElement('a', { key: s.id, href: `#${s.id}` }, s.title))),
  }
})

import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { LegalDocument, type LegalCompanyBlock } from '@/components/legal/legal-document'
import { DEFAULT_TERMS_CONTENT } from '@/lib/cms/templates/legal/terms-defaults'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

const render = (company?: LegalCompanyBlock | null, content: LegalContent = DEFAULT_TERMS_CONTENT): string =>
  renderToStaticMarkup(jsx(LegalDocument, { content, company }))

const EMPTY: LegalCompanyBlock = { legalName: '', licence: '', address: 'Aspin Commercial Tower, Dubai' }

describe('LegalDocument company block', () => {
  it('renders the same page as before when no details are set', () => {
    const before = render()
    expect(render(null)).toBe(before)
    // An address alone is already on the page footer; it does not add the block.
    expect(render(EMPTY)).toBe(before)
    expect(before).not.toContain('company-details')
  })

  it('shows the filled lines and a contents entry once a legal name is set', () => {
    const html = render({ ...EMPTY, legalName: 'Example LLC' })
    expect(html).toContain('id="company-details"')
    expect(html).toContain('href="#company-details"')
    expect(html).toContain('Example LLC')
    expect(html).toContain('Aspin Commercial Tower, Dubai')
    expect(html).not.toContain('Trade licence:')
  })

  it('shows a licence on its own', () => {
    const html = render({ legalName: '', licence: '123, issued by DET', address: '' })
    expect(html).toContain('123, issued by DET')
    expect(html).not.toContain('Legal name:')
    expect(html).not.toContain('Registered office:')
  })

  it('never adds a second section when an editor already used the id', () => {
    const content: LegalContent = {
      ...DEFAULT_TERMS_CONTENT,
      sections: [
        ...DEFAULT_TERMS_CONTENT.sections,
        { ...DEFAULT_TERMS_CONTENT.sections[0], id: 'company-details', toc_label: 'Company', title: 'Company' },
      ],
    }
    const html = render({ ...EMPTY, legalName: 'Example LLC' }, content)
    expect(html.match(/id="company-details"/g)).toHaveLength(1)
  })
})
