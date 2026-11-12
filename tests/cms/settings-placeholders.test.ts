/**
 * Legal copy names the support address through `{{support_email}}`, filled from
 * Settings > General at render time, so changing the address in Settings updates
 * every legal page without editing its text.
 */
import { fillSettingsPlaceholders, SUPPORT_EMAIL_PLACEHOLDER } from '@/lib/cms/placeholders'

describe('fillSettingsPlaceholders', () => {
  it('fills every occurrence, inside a link and as its text', () => {
    const html = `<a href="mailto:${SUPPORT_EMAIL_PLACEHOLDER}">${SUPPORT_EMAIL_PLACEHOLDER}</a>`
    expect(fillSettingsPlaceholders(html, { supportEmail: 'info@example.com' })).toBe(
      '<a href="mailto:info@example.com">info@example.com</a>',
    )
  })

  it('tolerates spaces inside the braces, as an editor might type it', () => {
    expect(fillSettingsPlaceholders('{{ support_email }}', { supportEmail: 'a@b.co' })).toBe('a@b.co')
  })

  it('escapes the value so a bad setting cannot inject markup', () => {
    const out = fillSettingsPlaceholders('{{support_email}}', { supportEmail: '"><script>x</script>' })
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('leaves text without placeholders untouched', () => {
    const html = '<p>Email support@infiniatransfers.com</p>'
    expect(fillSettingsPlaceholders(html, { supportEmail: 'info@example.com' })).toBe(html)
  })

  it('leaves the placeholder alone when no address is configured', () => {
    expect(fillSettingsPlaceholders('{{support_email}}', { supportEmail: '' })).toBe('{{support_email}}')
  })

  it('ignores unknown placeholders', () => {
    expect(fillSettingsPlaceholders('{{unknown}}', { supportEmail: 'a@b.co' })).toBe('{{unknown}}')
  })
})
