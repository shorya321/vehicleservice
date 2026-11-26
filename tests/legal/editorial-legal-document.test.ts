/**
 * Terms, Privacy and Refund share the editorial layout. It must keep the behaviour the
 * plain LegalDocument had: Settings email filled in, the company block only once a legal
 * name or licence is set, and never a second `company-details` section. On top of that the
 * sections are numbered and the quick links never point at the page being read.
 */
jest.mock('@/lib/cms/sanitize', () => ({ sanitizeRichText: (html: string) => html }))
jest.mock('@/components/legal/table-of-contents', () => {
  const { createElement } = jest.requireActual('react')
  return {
    TableOfContents: ({ sections }: { sections: Array<{ id: string; title: string }> }) =>
      createElement('nav', null, sections.map((s) => createElement('a', { key: s.id, href: `#${s.id}` }, s.title))),
  }
})

import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { EditorialLegalDocument } from '@/components/legal/editorial-legal-document'
import type { LegalCompanyBlock } from '@/components/legal/legal-document'
import { DEFAULT_TERMS_CONTENT } from '@/lib/cms/templates/legal/terms-defaults'
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/cms/templates/legal/privacy-defaults'
import { DEFAULT_REFUND_CONTENT } from '@/lib/cms/templates/legal/refund-defaults'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

const EMPTY: LegalCompanyBlock = { legalName: '', licence: '', address: 'Aspin Commercial Tower, Dubai' }

const render = (
  props: { content?: LegalContent; company?: LegalCompanyBlock | null; supportEmail?: string; currentPath?: string } = {}
): string =>
  renderToStaticMarkup(
    jsx(EditorialLegalDocument, {
      content: props.content ?? DEFAULT_TERMS_CONTENT,
      company: props.company ?? null,
      supportEmail: props.supportEmail ?? 'help@example.com',
      currentPath: props.currentPath ?? '/terms',
    })
  )

describe('EditorialLegalDocument', () => {
  it.each([
    ['terms', DEFAULT_TERMS_CONTENT, '/terms'],
    ['privacy', DEFAULT_PRIVACY_CONTENT, '/privacy'],
    ['refund', DEFAULT_REFUND_CONTENT, '/refund'],
  ] as const)('%s fills the Settings email and leaves no placeholder', (_name, content, currentPath) => {
    const html = render({ content, currentPath })
    expect(html).toContain('href="mailto:help@example.com"')
    expect(html).not.toContain('{{support_email}}')
  })

  it('numbers every section and keeps the original anchors', () => {
    const html = render()
    DEFAULT_TERMS_CONTENT.sections.forEach((section, index) => {
      expect(html).toContain(`id="${section.id}"`)
      expect(html).toContain(`>${String(index + 1).padStart(2, '0')}<`)
    })
  })

  it('leaves the current page out of the quick links', () => {
    const html = render({ currentPath: '/privacy', content: DEFAULT_PRIVACY_CONTENT })
    expect(html).toContain('href="/terms"')
    expect(html).toContain('href="/refund"')
    expect(html).not.toMatch(/href="\/privacy"/)
  })

  it('adds no company block until a legal name or licence is set', () => {
    expect(render({ company: EMPTY })).not.toContain('company-details')
  })

  it('shows the company block as a numbered section with a contents entry', () => {
    const html = render({ company: { ...EMPTY, legalName: 'Example LLC' } })
    expect(html).toContain('id="company-details"')
    expect(html).toContain('href="#company-details"')
    expect(html).toContain('Example LLC')
    expect(html).toContain('Aspin Commercial Tower, Dubai')
    expect(html).not.toContain('Trade licence:')
  })

  it('never adds a second company section when an editor already used the id', () => {
    const content: LegalContent = {
      ...DEFAULT_TERMS_CONTENT,
      sections: [
        ...DEFAULT_TERMS_CONTENT.sections,
        { ...DEFAULT_TERMS_CONTENT.sections[0], id: 'company-details', toc_label: 'Company', title: 'Company' },
      ],
    }
    const html = render({ content, company: { ...EMPTY, legalName: 'Example LLC' } })
    expect(html.match(/id="company-details"/g)).toHaveLength(1)
  })
})
