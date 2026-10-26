/**
 * Business portal browser-tab icon.
 *
 * Business portals are white-label, so a tenant that has not uploaded a
 * favicon gets its own initials in its own primary colour (the same tile the
 * portal sidebar shows), never the platform icon.
 */

import { DEFAULT_THEME_CONFIG, getBusinessInitials } from '@/lib/business/branding-utils';
import { safeHexColor } from '@/lib/business/quotations/brand-logo';

export interface BusinessFaviconInput {
  faviconUrl: string | null;
  businessName: string;
  primaryColor: string;
}

export interface BusinessFaviconIcons {
  icon: { url: string; type?: string }[];
  /** Omitted for the monogram: iOS ignores SVG home-screen icons. */
  apple?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The initials tile as an SVG data URI. Inline, so there is no extra route to
 * secure and no request that could leak which tenant a page belongs to.
 */
export function monogramFaviconDataUri(businessName: string, primaryColor: string): string {
  const fill = safeHexColor(primaryColor, DEFAULT_THEME_CONFIG.accent.primary);
  const initials = escapeXml(getBusinessInitials(businessName));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${fill}"/>` +
    `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Links for the portal layout's `metadata.icons`. */
export function businessFaviconIcons({ faviconUrl, businessName, primaryColor }: BusinessFaviconInput): BusinessFaviconIcons {
  if (faviconUrl) {
    return { icon: [{ url: faviconUrl }], apple: faviconUrl };
  }
  const monogram = monogramFaviconDataUri(businessName, primaryColor);
  return { icon: [{ url: monogram, type: 'image/svg+xml' }] };
}
