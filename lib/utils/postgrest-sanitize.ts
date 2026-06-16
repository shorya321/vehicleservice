/**
 * Sanitize user input for safe use in PostgREST .or() ilike filters.
 *
 * Strips PostgREST structural chars (,.()\"') that break filter parsing,
 * then escapes SQL ILIKE wildcards (%_) so they match literally.
 */
export function sanitizePostgrestInput(input: string): string {
  let sanitized = input.replace(/[,.()"']/g, '')
  sanitized = sanitized.replace(/\\/g, '\\\\')
  sanitized = sanitized.replace(/%/g, '\\%')
  sanitized = sanitized.replace(/_/g, '\\_')
  return sanitized.trim()
}
