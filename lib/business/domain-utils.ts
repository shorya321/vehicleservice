/**
 * Domain Utilities for B2B Business Accounts
 * Handles subdomain generation, domain validation, and DNS verification
 */

/**
 * Generate a URL-safe subdomain from business name
 * @param businessName - The business name to convert
 * @returns URL-safe subdomain (lowercase, alphanumeric + hyphens)
 * @example "Acme Hotel & Resort" → "acme-hotel-resort"
 */
export function generateSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length (DNS label max is 63 chars)
    .substring(0, 63)
    // Remove trailing hyphen if truncation created one
    .replace(/-+$/, '');
}

/**
 * Validate domain format
 * @param domain - Domain to validate
 * @returns true if valid domain format
 * @example "transfers.acmehotel.com" → true
 */
export function isValidDomain(domain: string): boolean {
  // Domain regex: alphanumeric + hyphens, dots between labels
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}

/**
 * Extract subdomain from full domain
 * @param domain - Full domain (e.g., "transfers.acmehotel.com")
 * @returns First label of domain (e.g., "transfers")
 */
export function extractSubdomain(domain: string): string {
  return domain.split('.')[0];
}

/**
 * Generate unique verification token for DNS verification
 * @returns Unique verification token
 */
export function generateVerificationToken(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `verify-${timestamp}-${randomPart}`;
}

/**
 * Check if subdomain is reserved/invalid
 * @param subdomain - Subdomain to check
 * @returns true if subdomain is invalid/reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  const reserved = [
    'www',
    'api',
    'app',
    'admin',
    'customer',
    'vendor',
    'mail',
    'ftp',
    'localhost',
    'staging',
    'dev',
    'test',
    'demo',
  ];
  return reserved.includes(subdomain.toLowerCase());
}

/**
 * Validate subdomain format
 * @param subdomain - Subdomain to validate
 * @returns true if valid subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Must start and end with alphanumeric, can contain hyphens
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
  return subdomainRegex.test(subdomain) && !isReservedSubdomain(subdomain);
}

/**
 * Get Vercel CNAME target (sync version - uses env var only)
 * @returns CNAME target for DNS configuration
 * @deprecated Use getVercelCNAMEAsync() for automatic project-specific CNAME
 */
export function getVercelCNAME(): string {
  return process.env.VERCEL_CNAME || 'cname.vercel-dns.com';
}

/**
 * Get Vercel CNAME target (async version - fetches from Vercel API)
 * Priority: ENV var > Vercel API > Default fallback
 * @returns CNAME target for DNS configuration
 */
export async function getVercelCNAMEAsync(): Promise<string> {
  // 1. Check env var first (allows override)
  if (process.env.VERCEL_CNAME) {
    return process.env.VERCEL_CNAME;
  }

  // 2. Fetch from Vercel API (server-side only)
  try {
    const { getProjectRecommendedCNAME, isVercelConfigured } = await import('@/lib/vercel/api');

    if (isVercelConfigured()) {
      return await getProjectRecommendedCNAME();
    }
  } catch (error) {
    console.error('Error fetching CNAME from Vercel API:', error);
  }

  // 3. Default fallback
  return 'cname.vercel-dns.com';
}

/**
 * Build full domain URL
 * @param subdomain - Business subdomain
 * @returns Full URL (e.g., "https://acme.yourdomain.com")
 */
export function buildSubdomainURL(subdomain: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const baseDomain = new URL(siteUrl).hostname;
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${subdomain}.${baseDomain}`;
}
