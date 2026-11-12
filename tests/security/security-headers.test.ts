import { buildSecurityHeaders, buildCspReportOnly } from '@/lib/security/headers'

const SUPABASE = 'https://abc.supabase.co'
const SITE = 'https://infiniatransfers.com'

function headerMap(isDev = false): Record<string, string> {
  return Object.fromEntries(
    buildSecurityHeaders({ supabaseUrl: SUPABASE, siteUrl: SITE, isDev }).map((h) => [h.key, h.value]),
  )
}

function directives(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
      const [name, ...values] = d.split(/\s+/)
      return [name, values]
    }),
  )
}

describe('buildSecurityHeaders', () => {
  it('sends the safe headers', () => {
    const h = headerMap()
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['X-Frame-Options']).toBe('SAMEORIGIN')
    expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(h['Strict-Transport-Security']).toBe('max-age=31536000')
  })

  it('HSTS covers only the exact host and is never preloaded', () => {
    const hsts = headerMap()['Strict-Transport-Security']
    expect(hsts).not.toMatch(/includeSubDomains/i)
    expect(hsts).not.toMatch(/preload/i)
  })

  it('turns off unused device features but leaves payment to the browser default', () => {
    const pp = headerMap()['Permissions-Policy']
    expect(pp).toContain('camera=()')
    expect(pp).toContain('microphone=()')
    expect(pp).toContain('geolocation=()')
    // Stripe's wallet buttons need `payment` delegated to its iframe.
    expect(pp).not.toContain('payment')
  })

  it('ships the CSP as report-only, never enforced', () => {
    const h = headerMap()
    expect(h['Content-Security-Policy-Report-Only']).toBeDefined()
    expect(h['Content-Security-Policy']).toBeUndefined()
  })
})

describe('buildCspReportOnly', () => {
  const prod = directives(buildCspReportOnly({ supabaseUrl: SUPABASE, siteUrl: SITE, isDev: false }))

  it('allows Stripe scripts, frames and API', () => {
    expect(prod['script-src']).toEqual(expect.arrayContaining(['https://js.stripe.com', 'https://*.js.stripe.com']))
    expect(prod['frame-src']).toEqual(expect.arrayContaining(['https://js.stripe.com', 'https://hooks.stripe.com']))
    expect(prod['connect-src']).toEqual(expect.arrayContaining(['https://api.stripe.com']))
  })

  it('allows the project Supabase over https and websocket', () => {
    expect(prod['connect-src']).toEqual(expect.arrayContaining([SUPABASE, 'wss://abc.supabase.co']))
  })

  it('allows Google Maps for the admin locations page', () => {
    expect(prod['script-src']).toContain('https://maps.googleapis.com')
    expect(prod['connect-src']).toContain('https://maps.googleapis.com')
  })

  it('locks plugins, base and framing', () => {
    expect(prod['object-src']).toEqual(["'none'"])
    expect(prod['base-uri']).toEqual(["'self'"])
    expect(prod['frame-ancestors']).toEqual(["'self'"])
  })

  it('reports to the main site so tenant domains report too', () => {
    expect(prod['report-uri']).toEqual([`${SITE}/api/csp-report`])
  })

  it('allows eval and the HMR socket only in development', () => {
    expect(prod['script-src']).not.toContain("'unsafe-eval'")
    const dev = directives(buildCspReportOnly({ supabaseUrl: SUPABASE, siteUrl: SITE, isDev: true }))
    expect(dev['script-src']).toContain("'unsafe-eval'")
    expect(dev['connect-src']).toContain('ws:')
  })

  it('falls back to any Supabase project when the URL is missing', () => {
    const csp = directives(buildCspReportOnly({ supabaseUrl: undefined, siteUrl: SITE, isDev: false }))
    expect(csp['connect-src']).toEqual(expect.arrayContaining(['https://*.supabase.co', 'wss://*.supabase.co']))
  })
})
