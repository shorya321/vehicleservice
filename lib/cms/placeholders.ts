/**
 * Settings placeholders for CMS rich text.
 *
 * Legal copy writes `{{support_email}}` where it names the support address, and
 * the page fills it from Settings > General when it renders. Changing the address
 * in Settings then updates every legal page, with no copy edit and no chance of
 * two pages disagreeing.
 *
 * Isomorphic and dependency free, so jest and any renderer can use it.
 */

export const SUPPORT_EMAIL_PLACEHOLDER = '{{support_email}}'

export interface SettingsPlaceholderValues {
  /** Settings > General support email. Empty leaves the placeholder visible. */
  supportEmail: string
}

const SUPPORT_EMAIL_PATTERN = /\{\{\s*support_email\s*\}\}/g

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Fill known placeholders in an HTML string. Runs before sanitising, so the
 * sanitiser sees the real `mailto:` link. Values are HTML-escaped.
 */
export function fillSettingsPlaceholders(html: string, values: SettingsPlaceholderValues): string {
  const email = values.supportEmail.trim()
  if (!email) return html
  return html.replace(SUPPORT_EMAIL_PATTERN, escapeHtml(email))
}

/**
 * Booking-notice placeholders for CMS copy (FAQ answers, blog bodies).
 *
 * `{{lead_time}}` is the customer minimum lead time and `{{hourly_notice}}` the
 * notice hourly hire needs, both from Settings. Copy that writes them follows
 * the setting, so the pages always state what the checkout enforces.
 *
 * Values arrive already formatted ("2 hours"); see `leadPlaceholderValues` in
 * `lib/trips/lead-time.ts`. They are plain words, safe in text and in HTML.
 */
export const LEAD_TIME_PLACEHOLDER = '{{lead_time}}'
export const HOURLY_NOTICE_PLACEHOLDER = '{{hourly_notice}}'

export interface LeadPlaceholderValues {
  /** e.g. "2 hours" */
  leadTime: string
  /** e.g. "12 hours" */
  hourlyNotice: string
}

const LEAD_TIME_PATTERN = /\{\{\s*lead_time\s*\}\}/g
const HOURLY_NOTICE_PATTERN = /\{\{\s*hourly_notice\s*\}\}/g

/** Fill the booking-notice placeholders in one string. Other text is untouched. */
export function fillLeadTimePlaceholders(text: string, values: LeadPlaceholderValues): string {
  if (!text.includes('{{')) return text
  return text
    .replace(LEAD_TIME_PATTERN, values.leadTime)
    .replace(HOURLY_NOTICE_PATTERN, values.hourlyNotice)
}

/**
 * Every string inside a parsed content object, filled. Returns a new value and
 * never mutates the input; numbers, booleans and null pass through as they are.
 */
export function fillContentPlaceholders<T>(value: T, values: LeadPlaceholderValues): T {
  if (typeof value === 'string') return fillLeadTimePlaceholders(value, values) as T
  if (Array.isArray(value)) return value.map((item) => fillContentPlaceholders(item, values)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fillContentPlaceholders(item, values)])
    ) as T
  }
  return value
}
