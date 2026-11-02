/**
 * Which logo platform mail shows in its masthead.
 *
 * The source is the admin logo (Settings > admin logo), so changing it in the admin
 * changes customer, vendor and driver mail too. Pure and free of Node imports: the admin
 * preview page runs this in the browser. The settings read lives in
 * platform-logo.server.ts.
 */

import { BUILT_IN_LOGOS, resolveSiteLogo, type LogoSettings } from '@/lib/site-settings/logo';
import type { PlatformEmailLogo } from '../transport/types';

const PRODUCTION_ORIGIN = 'https://infiniatransfers.com';

/** Masthead height in px. Matches the wordmark block it replaces. */
const LOGO_HEIGHT = 40;

/** Bundled artwork for dark backgrounds: gold mark, light lettering. */
export const BUILT_IN_EMAIL_LOGO = {
  path: BUILT_IN_LOGOS.horizontal.dark,
  height: LOGO_HEIGHT,
  width: Math.round((BUILT_IN_LOGOS.horizontal.width / BUILT_IN_LOGOS.horizontal.height) * LOGO_HEIGHT),
} as const;

/** Formats Gmail and Outlook both render. SVG and WebP fail in at least one of them. */
const MAIL_SAFE_IMAGE = /\.(png|jpe?g|gif)$/i;

/**
 * The origin images are served from. A mail client fetches the image long after the send,
 * from the recipient's network, so localhost or plain http would show a broken image.
 */
export function emailAssetOrigin(appUrl: string): string {
  try {
    const url = new URL(appUrl);
    const host = url.hostname;
    const local = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local');
    return url.protocol === 'https:' && !local ? url.origin : PRODUCTION_ORIGIN;
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

function isMailSafeUpload(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && MAIL_SAFE_IMAGE.test(url.pathname);
  } catch {
    return false;
  }
}

/** The admin logo's dark-theme file, else the bundled dark artwork. */
export function pickPlatformEmailLogo(settings: LogoSettings, appUrl: string): PlatformEmailLogo {
  const admin = resolveSiteLogo(settings, 'admin');

  if (admin.custom && isMailSafeUpload(admin.dark)) {
    return { url: admin.dark, width: null, height: LOGO_HEIGHT };
  }

  return builtInEmailLogo(appUrl);
}

export function builtInEmailLogo(appUrl: string): PlatformEmailLogo {
  return {
    url: `${emailAssetOrigin(appUrl)}${BUILT_IN_EMAIL_LOGO.path}`,
    width: BUILT_IN_EMAIL_LOGO.width,
    height: BUILT_IN_EMAIL_LOGO.height,
  };
}
