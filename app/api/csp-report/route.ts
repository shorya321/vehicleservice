import { NextResponse, type NextRequest } from 'next/server'
import { parseCspReports, createLogBudget, MAX_REPORT_BYTES } from '@/lib/security/csp-report'

/**
 * Receives CSP Report-Only violations (see lib/security/headers.ts) and writes one
 * compact line per violation to the server log. Nothing is stored.
 *
 * Public by design: browsers post here without credentials, from every host. The
 * answer is always 204 so the endpoint tells a caller nothing.
 */

const logBudget = createLogBudget(60, 60_000)

export async function POST(request: NextRequest): Promise<NextResponse> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_REPORT_BYTES) {
    return new NextResponse(null, { status: 204 })
  }

  try {
    const reports = parseCspReports(await request.text())
    for (const report of reports) {
      if (!logBudget()) break
      console.warn(
        `[csp-report] ${report.directive || '?'} blocked=${report.blockedUri || '?'} page=${report.documentUri || '?'}`,
      )
    }
  } catch (error: unknown) {
    console.error('[csp-report] could not read report body', error instanceof Error ? error.message : error)
  }

  return new NextResponse(null, { status: 204 })
}
