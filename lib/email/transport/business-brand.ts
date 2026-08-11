/**
 * Builds the email brand for a tenant from its business_accounts row.
 *
 * Kept separate from resolve-config so it can be unit tested without a database, and so
 * the URL precedence lives in one place rather than being re-derived per caller.
 */

import { getPlatformBrand, PLATFORM_BRAND_COLORS } from '../brand/brand';
import type { EmailBrand, EmailBrandColors } from './types';

export interface BusinessBrandRow {
  business_name: string | null;
  brand_name: string | null;
  logo_url: string | null;
  business_email: string | null;
  address: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  /** JSONB, so arbitrary. Never trusted, always run through hex(). */
  theme_config?: unknown;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * theme_config is JSONB and can hold anything. A malformed value reaching an inline
 * style is at best an unstyled email and at worst a broken render, so anything that is
 * not a plain 6-digit hex falls back.
 *
 * lib/business/quotations/brand-logo.ts has an identical guard for the PDF renderer.
 * It is duplicated rather than imported because lib/email must not depend on
 * lib/business: the dependency runs the other way.
 */
function hex(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim()) ? value.trim() : fallback;
}

/**
 * White or near-black, whichever stays readable on the tenant's accent.
 *
 * A tenant is free to pick a pale gold as their primary, and white label text on it is
 * unreadable. Relative luminance per WCAG, with the 0.5 split that keeps both ends of
 * the range comfortably above 4.5:1.
 */
function contrastText(background: string): string {
  const channel = (pair: string): number => {
    const c = parseInt(pair, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * channel(background.slice(1, 3)) +
    0.7152 * channel(background.slice(3, 5)) +
    0.0722 * channel(background.slice(5, 7));

  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

/**
 * Maps the tenant's portal theme onto the email palette.
 *
 * Only the light palette is read. Email clients give no reliable dark-mode signal, and a
 * message rendered in dark colours inside a light client is worse than one that ignores
 * the preference entirely.
 *
 * The surface mapping is deliberately not one-to-one: `light.surface` becomes the page
 * behind the card and `light.card` becomes the card, so the card stays lighter than its
 * surroundings. Taking `light.background` for the page would invert that relationship for
 * the default theme, where background is #FFFFFF and surface is #FAFAFA.
 */
function buildColors(themeConfig: unknown): EmailBrandColors {
  if (!themeConfig || typeof themeConfig !== 'object') {
    return PLATFORM_BRAND_COLORS;
  }

  const theme = themeConfig as Record<string, unknown>;
  const accent = (theme.accent ?? {}) as Record<string, unknown>;
  const light = (theme.light ?? {}) as Record<string, unknown>;

  const primary = hex(accent.primary, PLATFORM_BRAND_COLORS.primary);

  return {
    primary,
    primaryText: contrastText(primary),
    background: hex(light.surface, PLATFORM_BRAND_COLORS.background),
    surface: hex(light.card, PLATFORM_BRAND_COLORS.surface),
    heading: hex(light.text_primary, PLATFORM_BRAND_COLORS.heading),
    text: hex(light.text_primary, PLATFORM_BRAND_COLORS.text),
    muted: hex(light.text_secondary, PLATFORM_BRAND_COLORS.muted),
    border: hex(light.border, PLATFORM_BRAND_COLORS.border),
  };
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
    colors: buildColors(row.theme_config),
  };
}
