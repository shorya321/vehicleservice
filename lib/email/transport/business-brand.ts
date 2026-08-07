/**
 * Builds the email brand for a tenant from its business_accounts row.
 *
 * Kept separate from resolve-config so it can be unit tested without a database, and so
 * the URL precedence lives in one place rather than being re-derived per caller.
 */

import { getPlatformBrand } from '../brand/brand';
import type { EmailBrand } from './types';

export interface BusinessBrandRow {
  business_name: string | null;
  brand_name: string | null;
  logo_url: string | null;
  business_email: string | null;
  address: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
}

/** Root domain that tenant subdomains hang off, for building a fallback brand URL. */
function rootDomain(): string {
  const platformUrl = getPlatformBrand().url;

  try {
    return new URL(platformUrl).host;
  } catch {
    return 'infiniatransfers.com';
  }
}

/**
 * A verified custom domain wins, then the subdomain, then the platform URL. This mirrors
 * how proxy.ts resolves a tenant, so the address in an email footer matches the address
 * the recipient would actually land on.
 */
function brandUrl(row: BusinessBrandRow): string {
  if (row.custom_domain && row.custom_domain_verified) {
    return `https://${row.custom_domain}`;
  }

  if (row.subdomain) {
    return `https://${row.subdomain}.${rootDomain()}`;
  }

  return getPlatformBrand().url;
}

export function buildBusinessBrand(row: BusinessBrandRow): EmailBrand {
  const platform = getPlatformBrand();
  const name = row.brand_name?.trim() || row.business_name?.trim() || platform.name;

  return {
    name,
    // Falls back to the platform's postal address only because a physical address is a
    // CAN-SPAM requirement and an empty footer would be worse than a generic one.
    address: row.address?.trim() || platform.address,
    url: brandUrl(row),
    logoUrl: row.logo_url,
    supportEmail: row.business_email,
    // False for every tenant: /privacy, /terms and /contact are the platform's own
    // pages, and showing them under a tenant's brand tells the recipient the tenant's
    // legal terms are the platform's.
    showPlatformLinks: false,
  };
}
