/**
 * Domain Routing Utilities for Business Multi-Tenant Isolation
 *
 * Handles route restrictions on business subdomains and custom domains
 * to ensure proper tenant isolation in the multi-tenant SaaS architecture.
 */

/**
 * Patterns allowed on business custom domains
 * These are the only routes accessible when accessing via subdomain/custom domain
 */
const ALLOWED_PATTERNS = [
  '/business',      // All business portal routes
  '/_next',         // Next.js internals (static assets, chunks)
  '/api/business',  // Business-specific API endpoints
  '/favicon.ico',   // Favicon
] as const

/**
 * Check if a pathname is allowed on business custom domains
 *
 * @param pathname - The request pathname to check
 * @returns true if the path is allowed on custom domains
 *
 * @example
 * isAllowedOnCustomDomain('/business/dashboard') // true
 * isAllowedOnCustomDomain('/admin') // false
 */
export function isAllowedOnCustomDomain(pathname: string): boolean {
  // Root path is special - will be redirected
  if (pathname === '/') {
    return false
  }

  // Check if path matches any allowed pattern
  return ALLOWED_PATTERNS.some(pattern => pathname.startsWith(pattern))
}

/**
 * Get the appropriate business redirect path based on auth state
 *
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Path to redirect to
 *
 * @example
 * getBusinessRedirectPath(true) // '/business/dashboard'
 * getBusinessRedirectPath(false) // '/business/login'
 */
export function getBusinessRedirectPath(isAuthenticated: boolean): string {
  return isAuthenticated ? '/business/dashboard' : '/business/login'
}

/**
 * Determine if route restrictions should apply based on hostname
 *
 * Route restrictions apply to:
 * - Business subdomains (e.g., acme.yourdomain.com)
 * - Custom domains (e.g., transfers.acmehotel.com)
 *
 * Route restrictions DO NOT apply to:
 * - Main platform domain (yourdomain.com)
 * - Localhost (development)
 *
 * @param hostname - Current request hostname
 * @param platformDomain - Main platform domain
 * @returns true if route restrictions should apply
 *
 * @example
 * shouldRestrictRoute('acme.yourdomain.com', 'yourdomain.com') // true
 * shouldRestrictRoute('yourdomain.com', 'yourdomain.com') // false
 */
export function shouldRestrictRoute(
  hostname: string,
  platformDomain: string
): boolean {
  // Don't restrict on main domain
  if (hostname === platformDomain) {
    return false
  }

  // Don't restrict on localhost (development)
  if (hostname.includes('localhost')) {
    return false
  }

  // Don't restrict on platform subdomains (future: could whitelist specific subdomains)
  // For now, all non-main-domain, non-localhost domains get restricted

  return true
}
