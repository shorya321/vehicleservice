/**
 * Response security headers, applied to every route from next.config.ts.
 *
 * The CSP has three modes, chosen by the CSP_MODE env var at build time:
 * - `report-only` (default): browsers report what it would block and block nothing.
 * - `enforce`: the same policy, blocking. Only after /api/csp-report runs clean,
 *   because a missing Stripe host stops payments.
 * - `off`: no CSP header at all. The other headers still ship.
 * An unset or unknown value is report-only, so a new server never enforces by
 * accident. Rollback on any host = set CSP_MODE and redeploy, no code change.
 *
 * Nothing here names a host: the site and Supabase come from env, so the policy
 * moves with the app to any server.
 *
 * Imported by next.config.ts, so relative imports only (no `@/` alias here).
 */

export type CspMode = 'report-only' | 'enforce' | 'off'

const CSP_MODES: readonly CspMode[] = ['report-only', 'enforce', 'off']

export function resolveCspMode(raw: string | undefined): CspMode {
  const value = (raw ?? '').trim().toLowerCase()
  return (CSP_MODES as readonly string[]).includes(value) ? (value as CspMode) : 'report-only'
}

export interface SecurityHeaderOptions {
  /** NEXT_PUBLIC_SUPABASE_URL. Missing falls back to any Supabase project. */
  supabaseUrl: string | undefined
  /** Main platform URL. Reports go here so tenant domains report too. */
  siteUrl: string
  /** Dev needs eval (React refresh) and the HMR websocket. */
  isDev: boolean
  /** CSP_MODE. Omitted means report-only. */
  cspMode?: CspMode
}

type CspOptions = Omit<SecurityHeaderOptions, 'cspMode'>

export interface ResponseHeader {
  key: string
  value: string
}

const STRIPE_SCRIPTS = ['https://js.stripe.com', 'https://*.js.stripe.com']
const STRIPE_FRAMES = ['https://js.stripe.com', 'https://*.js.stripe.com', 'https://hooks.stripe.com']
const STRIPE_CONNECT = ['https://api.stripe.com', 'https://*.stripe.com', 'https://*.stripe.network']
// Admin > Locations loads the Maps JS API with Places. Google's allowlist:
// https://developers.google.com/maps/documentation/javascript/content-security-policy
// Its 'unsafe-eval' is left out on purpose; the reports will show if Maps needs it.
const GOOGLE_HOSTS = ['https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.google.com']
const GOOGLE_MAPS_SCRIPTS = [...GOOGLE_HOSTS, 'https://*.ggpht.com', 'https://*.googleusercontent.com', 'blob:']
const GOOGLE_MAPS_CONNECT = [...GOOGLE_HOSTS, 'data:', 'blob:']
const GOOGLE_MAPS_FRAMES = ['https://*.google.com']
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

export function buildCsp({ supabaseUrl, siteUrl, isDev }: CspOptions): string {
  const site = siteUrl.replace(/\/+$/, '')
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next's inline bootstrap scripts need 'unsafe-inline' until nonces are wired.
    'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...STRIPE_SCRIPTS, ...GOOGLE_MAPS_SCRIPTS, ...VERCEL_LIVE],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", ...supabaseOrigins(supabaseUrl), ...STRIPE_CONNECT, ...GOOGLE_MAPS_CONNECT, ...VERCEL_LIVE, ...(isDev ? ['ws:'] : [])],
    'frame-src': ["'self'", ...STRIPE_FRAMES, ...GOOGLE_MAPS_FRAMES, ...VERCEL_LIVE],
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

function cspHeader({ cspMode = 'report-only', ...options }: SecurityHeaderOptions): ResponseHeader[] {
  if (cspMode === 'off') return []
  const key = cspMode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'
  return [{ key, value: buildCsp(options) }]
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
    ...cspHeader(options),
  ]
}
