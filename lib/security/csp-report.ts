/**
 * Parsing for CSP violation reports posted by browsers to /api/csp-report.
 *
 * Anyone can post here, so every field is treated as untrusted: the body is size
 * capped, only three fields are kept, each is truncated, and query strings are
 * dropped so a token in a page URL never lands in the server log.
 */

export const MAX_REPORT_BYTES = 16 * 1024
const MAX_REPORTS_PER_BODY = 10
const MAX_FIELD_LENGTH = 200

export interface CspReport {
  documentUri: string
  directive: string
  blockedUri: string
}

function clean(value: unknown): string {
  if (typeof value !== 'string') return ''
  const withoutQuery = value.split(/[?#]/)[0]
  return withoutQuery.slice(0, MAX_FIELD_LENGTH)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fromLegacy(report: Record<string, unknown>): CspReport {
  return {
    documentUri: clean(report['document-uri']),
    directive: clean(report['effective-directive'] ?? report['violated-directive']),
    blockedUri: clean(report['blocked-uri']),
  }
}

function fromReportingApi(entry: unknown): CspReport | null {
  if (!isRecord(entry) || entry.type !== 'csp-violation' || !isRecord(entry.body)) return null
  const body = entry.body
  return {
    documentUri: clean(body.documentURL),
    directive: clean(body.effectiveDirective),
    blockedUri: clean(body.blockedURL),
  }
}

export function parseCspReports(raw: string): CspReport[] {
  if (!raw || raw.length > MAX_REPORT_BYTES) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  if (Array.isArray(parsed)) {
    return parsed
      .slice(0, MAX_REPORTS_PER_BODY)
      .map(fromReportingApi)
      .filter((r): r is CspReport => r !== null)
  }
  if (isRecord(parsed) && isRecord(parsed['csp-report'])) {
    return [fromLegacy(parsed['csp-report'])]
  }
  return []
}

/** Fixed-window budget so a flood of posts cannot flood the log. Per instance. */
export function createLogBudget(limit: number, windowMs: number, now: () => number = Date.now): () => boolean {
  let windowStart = now()
  let used = 0
  return () => {
    const t = now()
    if (t - windowStart > windowMs) {
      windowStart = t
      used = 0
    }
    if (used >= limit) return false
    used += 1
    return true
  }
}
