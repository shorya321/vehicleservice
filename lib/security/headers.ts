/**
 * Response security headers, applied to every route from next.config.ts.
 *
 * The CSP ships as Report-Only: browsers report what it would block and block
 * nothing. Switch the key to `Content-Security-Policy` only after the reports at
 * /api/csp-report have run clean, because a missing Stripe host stops payments.
 *
 * Imported by next.config.ts, so relative imports only (no `@/` alias here).
 */

export interface SecurityHeaderOptions {
  /** NEXT_PUBLIC_SUPABASE_URL. Missing falls back to any Supabase project. */
  supabaseUrl: string | undefined
  /** Main platform URL. Reports go here so tenant domains report too. */
  siteUrl: string
  /** Dev needs eval (React refresh) and the HMR websocket. */
  isDev: boolean
}

export interface ResponseHeader {
  key: string
  value: string
}

const STRIPE_SCRIPTS = ['https://js.stripe.com', 'https://*.js.stripe.com']
const STRIPE_FRAMES = ['https://js.stripe.com', 'https://*.js.stripe.com', 'https://hooks.stripe.com']
const STRIPE_CONNECT = ['https://api.stripe.com', 'https://*.stripe.com', 'https://*.stripe.network']
// Admin > Locations loads the Maps JS API with Places.
const GOOGLE_MAPS = ['https://maps.googleapis.com']
// Vercel's preview-deploy toolbar. Absent in production, harmless to allow.
const VERCEL_LIVE = ['https://vercel.live']

function supabaseOrigins(supabaseUrl: string | undefined): string[] {
  try {
    if (supabaseUrl) {
      const { host } = new URL(supabaseUrl)
      return [`https://${host}`, `wss://${host}`]
    }
  } catch {
    // An unparsable URL falls through to the wildcard.
  }
  return ['https://*.supabase.co', 'wss://*.supabase.co']
}

export function buildCspReportOnly({ supabaseUrl, siteUrl, isDev }: SecurityHeaderOptions): string {
  const site = siteUrl.replace(/\/+$/, '')
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next's inline bootstrap scripts need 'unsafe-inline' until nonces are wired.
    'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...STRIPE_SCRIPTS, ...GOOGLE_MAPS, ...VERCEL_LIVE],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", ...supabaseOrigins(supabaseUrl), ...STRIPE_CONNECT, ...GOOGLE_MAPS, ...VERCEL_LIVE, ...(isDev ? ['ws:'] : [])],
    'frame-src': ["'self'", ...STRIPE_FRAMES, ...VERCEL_LIVE],
    'media-src': ["'self'", 'blob:', 'https:'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'report-uri': [`${site}/api/csp-report`],
  }
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): ResponseHeader[] {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Unused device features off. `payment` is left at the browser default so
    // Stripe's iframe can still be delegated wallet payments.
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()' },
    // Exact host only, no preload: both are hard to walk back. Browsers ignore
    // HSTS over plain HTTP, so local dev is unaffected.
    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    { key: 'Content-Security-Policy-Report-Only', value: buildCspReportOnly(options) },
  ]
}
