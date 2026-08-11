/**
 * The brand an email template renders under.
 *
 * This module is deliberately isomorphic and imports nothing from node. It is pulled
 * in by lib/email/templates/base/layout.tsx, which is rendered *in the browser* by
 * app/admin/emails/components/email-management-client.tsx for the template preview, so
 * an AsyncLocalStorage import here would break the client bundle.
 *
 * The seam is a registered resolver rather than a React context, because
 * React.createContext does not exist in the react-server layer where route handlers
 * and email services run.
 *
 * On the server, lib/email/brand/brand-store.server.ts registers a resolver backed by
 * AsyncLocalStorage. In the client bundle nothing registers one, so previews fall back
 * to the platform brand, which is exactly right for an admin previewing platform mail.
 */

import type { EmailBrand, EmailBrandColors } from '../transport/types';

export type { EmailBrand };

export const PLATFORM_BRAND_NAME = 'Infinia Transfers';
export const PLATFORM_BRAND_ADDRESS = '123 Business Bay, Dubai, UAE';

/**
 * The platform palette, transcribed from the values already hardcoded in
 * lib/email/templates/base/layout.tsx and lib/email/styles/constants.ts.
 *
 * These are not a new design. They exist so that anything rendering without a tenant in
 * scope resolves to exactly what it renders today, which is what makes the shared
 * template snapshots hold.
 */
export const PLATFORM_BRAND_COLORS: EmailBrandColors = {
  primary: '#556cd6',
  primaryText: '#ffffff',
  background: '#f6f9fc',
  surface: '#ffffff',
  heading: '#1a1a1a',
  text: '#525f7f',
  muted: '#8898aa',
  border: '#e6ebf1',
};

function platformUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://infiniatransfers.com')
  );
}

/** The brand used for platform mail, and the fallback whenever no tenant is in scope. */
export function getPlatformBrand(): EmailBrand {
  return {
    name: PLATFORM_BRAND_NAME,
    address: PLATFORM_BRAND_ADDRESS,
    url: platformUrl(),
    logoUrl: null,
    supportEmail: null,
    showPlatformLinks: true,
    colors: PLATFORM_BRAND_COLORS,
  };
}

type BrandResolver = () => EmailBrand | null;

let resolver: BrandResolver | null = null;

/** Installed once, at module load, by the server-only brand store. */
export function registerBrandResolver(fn: BrandResolver): void {
  resolver = fn;
}

/** Test seam. */
export function clearBrandResolver(): void {
  resolver = null;
}

/**
 * The brand for the email currently being rendered, or the platform brand when there
 * is no tenant in scope.
 */
export function getCurrentBrand(): EmailBrand {
  return resolver?.() ?? getPlatformBrand();
}
