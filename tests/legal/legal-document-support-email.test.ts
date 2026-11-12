/**
 * Legal pages fill `{{support_email}}` from Settings > General. The shipped
 * Terms, Privacy and Vendor Agreement text use the placeholder, never a typed
 * address, so the pages cannot disagree with Settings.
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
import { LegalDocument } from '@/components/legal/legal-document'
import { DEFAULT_TERMS_CONTENT } from '@/lib/cms/templates/legal/terms-defaults'
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/cms/templates/legal/privacy-defaults'
import { DEFAULT_VENDOR_AGREEMENT_CONTENT } from '@/lib/cms/templates/legal/vendor-agreement-defaults'

const DEFAULTS = {
  terms: DEFAULT_TERMS_CONTENT,
  privacy: DEFAULT_PRIVACY_CONTENT,
  'vendor agreement': DEFAULT_VENDOR_AGREEMENT_CONTENT,
}

describe('LegalDocument support email', () => {
  it.each(Object.entries(DEFAULTS))('%s fallback names the Settings address, never a typed one', (_name, content) => {
    const text = JSON.stringify(content)
    expect(text).toContain('{{support_email}}')
    expect(text).not.toMatch(/[a-z]+@infiniatransfers\.com/)
  })

  it.each(Object.entries(DEFAULTS))('%s renders with the Settings address filled in', (_name, content) => {
    const html = renderToStaticMarkup(jsx(LegalDocument, { content, supportEmail: 'help@example.com' }))
    expect(html).toContain('href="mailto:help@example.com"')
    expect(html).not.toContain('{{support_email}}')
  })
})
