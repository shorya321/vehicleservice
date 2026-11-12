import { parseCspReports, createLogBudget, MAX_REPORT_BYTES } from '@/lib/security/csp-report'

describe('parseCspReports', () => {
  it('reads the legacy report-uri body', () => {
    const body = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://infiniatransfers.com/payment/ABC',
        'violated-directive': 'script-src-elem',
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/x.js',
      },
    })
    expect(parseCspReports(body)).toEqual([
      { documentUri: 'https://infiniatransfers.com/payment/ABC', directive: 'script-src-elem', blockedUri: 'https://evil.example/x.js' },
    ])
  })

  it('reads the Reporting API array and skips other report types', () => {
    const body = JSON.stringify([
      { type: 'csp-violation', body: { documentURL: 'https://a.test/', effectiveDirective: 'img-src', blockedURL: 'https://b.test/i.png' } },
      { type: 'deprecation', body: { id: 'x' } },
    ])
    expect(parseCspReports(body)).toEqual([
      { documentUri: 'https://a.test/', directive: 'img-src', blockedUri: 'https://b.test/i.png' },
    ])
  })

  it('returns nothing for junk, empty or oversized bodies', () => {
    expect(parseCspReports('not json')).toEqual([])
    expect(parseCspReports('')).toEqual([])
    expect(parseCspReports('{"other":1}')).toEqual([])
    expect(parseCspReports('x'.repeat(MAX_REPORT_BYTES + 1))).toEqual([])
  })

  it('truncates long fields and drops query strings', () => {
    const long = 'https://a.test/' + 'p'.repeat(500) + '?token=secret'
    const [r] = parseCspReports(JSON.stringify({ 'csp-report': { 'document-uri': long, 'violated-directive': 'img-src', 'blocked-uri': 'inline' } }))
    expect(r.documentUri.length).toBeLessThanOrEqual(200)
    expect(r.documentUri).not.toContain('secret')
  })

  it('caps the number of reports taken from one body', () => {
    const many = Array.from({ length: 50 }, () => ({ type: 'csp-violation', body: { documentURL: 'https://a.test/', effectiveDirective: 'img-src', blockedURL: 'data' } }))
    expect(parseCspReports(JSON.stringify(many)).length).toBe(10)
  })
})

describe('createLogBudget', () => {
  it('allows a fixed number of lines per window, then refills', () => {
    let now = 0
    const budget = createLogBudget(3, 60_000, () => now)
    expect([budget(), budget(), budget(), budget()]).toEqual([true, true, true, false])
    now = 60_001
    expect(budget()).toBe(true)
  })
})
