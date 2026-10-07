/**
 * Which pages offer Publish/Unpublish. Home, Terms, Privacy and Contact fall
 * back to their shipped copy when no published row exists, so a status toggle
 * there would do nothing visible except drop them from the sitemap.
 */
import { canChangePageStatus } from '@/lib/cms/types'

describe('canChangePageStatus', () => {
  it('allows the vendor agreement, which 404s while a draft', () => {
    expect(canChangePageStatus({ kind: 'system', template: 'vendor-agreement' })).toBe(true)
  })

  it('allows custom pages', () => {
    expect(canChangePageStatus({ kind: 'custom', template: 'blocks' })).toBe(true)
  })

  it.each(['home', 'contact', 'terms', 'privacy', 'become-vendor'] as const)(
    'refuses the %s system page',
    (template) => {
      expect(canChangePageStatus({ kind: 'system', template })).toBe(false)
    }
  )
})
