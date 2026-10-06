import DOMPurify from 'isomorphic-dompurify'

/**
 * Tags the legal and long-text editors produce. Anything else (scripts,
 * iframes, inline styles, event handlers) is stripped before render.
 */
const ALLOWED_TAGS = ['p', 'br', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'a', 'blockquote']
const ALLOWED_ATTR = ['href', 'target', 'rel']

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
