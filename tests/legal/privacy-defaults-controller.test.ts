/**
 * The Nov 2026 audit (S-8): the Privacy Policy must say who the data controller
 * is and name the UAE data protection law. Pinned on the shipped text, which is
 * what /privacy renders while its admin content is empty.
 */
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/cms/templates/legal/privacy-defaults'

const intro = DEFAULT_PRIVACY_CONTENT.sections.find((s) => s.id === 'introduction')?.body ?? ''

describe('privacy defaults: controller and governing law', () => {
  it('names the data controller in the introduction', () => {
    expect(intro).toContain('Infinia Transfers is the data controller')
  })

  it('names the UAE personal data law by its decree number', () => {
    expect(intro).toContain('Federal Decree-Law No. 45 of 2021')
  })

  it('points to the support address from Settings, never a typed one', () => {
    expect(intro).toContain('mailto:{{support_email}}')
  })
})
