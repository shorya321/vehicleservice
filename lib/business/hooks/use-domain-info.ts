/**
 * Domain Info Hook
 * Client-side hook for detecting domain type (main, subdomain, custom domain)
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useState, useEffect } from 'react';

interface DomainInfo {
  /** Whether we're on the main platform domain (or localhost for dev) */
  isMainDomain: boolean;
  /** Whether we're on a business subdomain (e.g., acme.yourdomain.com) */
  isSubdomain: boolean;
  /** Whether we're on a custom domain (e.g., transfers.acmehotel.com) */
  isCustomDomain: boolean;
  /** Whether domain detection is still in progress */
  isLoading: boolean;
}

/**
 * Hook to detect the current domain type
 *
 * Uses the same logic as the login API route (app/api/business/auth/login/route.ts)
 * to ensure consistent domain detection across the application.
 *
 * @returns DomainInfo object with domain type flags
 *
 * @example
 * const { isMainDomain, isSubdomain, isCustomDomain, isLoading } = useDomainInfo();
 *
 * // Show signup link only on main domain
 * if (isMainDomain && !isLoading) {
 *   return <SignupLink />;
 * }
 */
export function useDomainInfo(): DomainInfo {
  const [domainInfo, setDomainInfo] = useState<DomainInfo>({
    isMainDomain: true, // Default to main domain (safest default for SSR)
    isSubdomain: false,
    isCustomDomain: false,
    isLoading: true,
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const platformDomain = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
    ).hostname;

    // Main platform check (including localhost for development)
    // This matches the logic in login/route.ts lines 122-123
    const isMainPlatform =
      hostname === platformDomain ||
      hostname === 'localhost' ||
      hostname.includes('localhost');

    // Subdomain check - hostname ends with .platformDomain
    // This matches the logic in login/route.ts line 151
    const isSubdomain =
      !isMainPlatform && hostname.endsWith(`.${platformDomain}`);

    // Custom domain - not main platform, not subdomain, not localhost
    // This matches the logic in login/route.ts lines 131-150
    const isCustomDomain = !isMainPlatform && !isSubdomain;

    setDomainInfo({
      isMainDomain: isMainPlatform,
      isSubdomain,
      isCustomDomain,
      isLoading: false,
    });
  }, []);

  return domainInfo;
}
