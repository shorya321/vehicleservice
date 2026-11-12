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
