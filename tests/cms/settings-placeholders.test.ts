/**
 * Legal copy names the support address through `{{support_email}}`, filled from
 * Settings > General at render time, so changing the address in Settings updates
 * every legal page without editing its text.
 */
import {
  fillContentPlaceholders,
  fillLeadTimePlaceholders,
  fillSettingsPlaceholders,
  SUPPORT_EMAIL_PLACEHOLDER,
} from '@/lib/cms/placeholders'
import { leadPlaceholderValues } from '@/lib/trips/lead-time'

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

describe('booking-notice placeholders', () => {
  const values = leadPlaceholderValues({ minLeadHours: 2, hourlyMinNoticeHours: 12 })

  it('formats the lead and the hourly notice from settings', () => {
    expect(values).toEqual({ leadTime: '2 hours', hourlyNotice: '12 hours' })
    expect(leadPlaceholderValues({ minLeadHours: 1, hourlyMinNoticeHours: 12 }).leadTime).toBe('1 hour')
    expect(leadPlaceholderValues({ minLeadHours: 0, hourlyMinNoticeHours: 0 })).toEqual({
      leadTime: 'a few minutes',
      hourlyNotice: 'a few minutes',
    })
  })

  it('gives hourly the longer of its notice and the lead, as the checkout does', () => {
    expect(leadPlaceholderValues({ minLeadHours: 24, hourlyMinNoticeHours: 12 }).hourlyNotice).toBe('24 hours')
  })

  it('fills both placeholders, every occurrence, with spaces tolerated', () => {
    expect(fillLeadTimePlaceholders('Book up to {{lead_time}} ahead; hourly {{ hourly_notice }}. {{lead_time}}!', values))
      .toBe('Book up to 2 hours ahead; hourly 12 hours. 2 hours!')
  })

  it('leaves other text and unknown or support placeholders alone', () => {
    expect(fillLeadTimePlaceholders('24 hours is comfortable.', values)).toBe('24 hours is comfortable.')
    expect(fillLeadTimePlaceholders('{{support_email}} {{unknown}}', values)).toBe('{{support_email}} {{unknown}}')
  })

  it('fills every string in a content object without mutating it', () => {
    const content = {
      faq: { visible: true, items: [{ question: 'How far ahead?', answer: 'Up to {{lead_time}} before pickup.' }] },
      count: 3,
      empty: null,
    }
    const filled = fillContentPlaceholders(content, values)
    expect(filled.faq.items[0].answer).toBe('Up to 2 hours before pickup.')
    expect(filled.faq.visible).toBe(true)
    expect(filled.count).toBe(3)
    expect(filled.empty).toBeNull()
    expect(content.faq.items[0].answer).toBe('Up to {{lead_time}} before pickup.')
    expect(filled).not.toBe(content)
  })
})
