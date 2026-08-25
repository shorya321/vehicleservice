/**
 * Where to send a business tenant's browser back to.
 *
 * The problem this solves: Supabase auth cookies are host-only. lib/supabase/server.ts
 * never passes a `domain` option, so a session established on vendor.example.com does
 * not exist on example.com. Any absolute URL handed to a third party (a Stripe
 * success_url, an email link) has to land on the SAME host the tenant started on, or
 * they arrive signed out and proxy.ts bounces them to /business/login.
 *
 * The constraint: the Host header cannot be trusted. This app is served from two places
 * (Coolify for the platform, Vercel for the business module) and the forwarding headers
 * on the Coolify side are spoofable. So no candidate host is ever used as-is; each is
 * only MATCHED against an allowlist derived from the authenticated tenant's own row. A
 * forged Host or Origin can therefore only select a host the signed-in business already
 * owns, and anything unrecognised falls back to the platform origin - which is exactly
 * the behaviour that existed before this file.
 *
 * The same validation shape is hand-rolled in app/api/business/auth/login/route.ts and
 * app/api/business/auth/forgot-password/route.ts. Those can adopt these helpers later.
 */

import { getAppUrl } from '@/lib/email/config';

export interface TenantDomains {
  /** business_accounts.subdomain */
  subdomain: string | null;
  /** business_accounts.custom_domain */
  customDomain: string | null;
  /** business_accounts.custom_domain_verified */
  customDomainVerified: boolean | null;
}

/**
 * Note this matches on a `.localhost` suffix rather than a `localhost` prefix:
 * `vrooem.localhost:3001` is a real dev host and does not start with "localhost".
 */
function isLocalHost(host: string): boolean {
  const name = host.split(':')[0];
  return name === 'localhost' || name.endsWith('.localhost') || name === '127.0.0.1';
}

function originFor(host: string): string {
  return `${isLocalHost(host) ? 'http' : 'https'}://${host}`;
}

/**
 * Host of the platform, port included: "example.com" or "localhost:3001".
 *
 * `.host`, not the `.hostname` proxy.ts uses, because the dev port is load-bearing when
 * building an absolute URL.
 */
function platformHost(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return null;

  try {
    return new URL(configured).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The platform origin.
 *
 * Identical to the `${process.env.NEXT_PUBLIC_SITE_URL}` prefix callers used before,
 * whenever that variable is set - which is what keeps the main-domain flow unchanged.
 * Falls through to getAppUrl() only when it is unset, because that never yields the
 * string "undefined".
 */
export function getPlatformOrigin(): string {
  const host = platformHost();
  return host ? originFor(host) : getAppUrl().replace(/\/+$/, '');
}

/**
 * Parse any candidate ("https://a.b", "a.b", "a.b:3001") down to a bare lowercase host.
 * Returns null for anything that is not http/https, so "javascript:..." and
 * "//evil.com" cannot become an origin.
 */
function hostOf(candidate: string | null | undefined): string | null {
  if (!candidate) return null;

  const raw = candidate.includes('://') ? candidate : `https://${candidate}`;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.host.toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Every host this tenant may legitimately be returned to, mapped to its full origin.
 *
 * 1. The platform domain, always - a tenant can and does sign in there.
 * 2. Their own subdomain of the platform.
 * 3. Their custom domain, ONLY once verified. An unverified domain is an unproven claim:
 *    get_business_by_custom_domain filters on custom_domain_verified, so proxy.ts will
 *    not serve the portal there either, and returning a payer to it would strand them.
 */
export function tenantOriginAllowlist(domains: TenantDomains): Map<string, string> {
  const allowed = new Map<string, string>();

  const platform = platformHost();
  if (platform) {
    allowed.set(platform, originFor(platform));

    if (domains.subdomain) {
      const [name, port] = platform.split(':');
      const sub = (
        port ? `${domains.subdomain}.${name}:${port}` : `${domains.subdomain}.${name}`
      ).toLowerCase();
      allowed.set(sub, originFor(sub));
    }
  }

  if (domains.customDomain && domains.customDomainVerified) {
    const custom = hostOf(domains.customDomain);
    if (custom) allowed.set(custom, originFor(custom));
  }

  return allowed;
}

/**
 * Resolve the origin to send this tenant's browser back to.
 *
 * Candidates, most to least authoritative:
 *   1. `clientOrigin` - window.location.origin, posted by the browser. Only the browser
 *      knows for certain which host holds its cookies.
 *   2. The `Origin` header - browsers attach it to every POST, so a tab still running a
 *      pre-deploy client bundle that does not send (1) resolves correctly anyway.
 *   3/4. x-forwarded-host, then Host - last resort, and the least trustworthy across the
 *      split deployment.
 *
 * Every one of them is validated against the allowlist, so the ordering is a correctness
 * preference, not a security boundary.
 */
export function resolveTenantOrigin(
  request: Request,
  domains: TenantDomains,
  clientOrigin?: string | null
): string {
  const allowed = tenantOriginAllowlist(domains);

  const candidates = [
    clientOrigin,
    request.headers.get('origin'),
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
  ];

  for (const candidate of candidates) {
    const host = hostOf(candidate);
    const match = host ? allowed.get(host) : undefined;
    if (match) return match;
  }

  return getPlatformOrigin();
}
