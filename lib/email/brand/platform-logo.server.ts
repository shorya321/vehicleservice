import { getSiteSettings } from '@/lib/site-settings/server';
import type { PlatformEmailLogo } from '../transport/types';
import { getPlatformBrand } from './brand';
import { builtInEmailLogo, pickPlatformEmailLogo } from './platform-logo';

/**
 * The admin logo for platform mail. Never throws: a settings read failure falls back to
 * the bundled artwork, so a logo problem can never stop an email going out.
 */
export async function getPlatformEmailLogo(): Promise<PlatformEmailLogo> {
  const appUrl = getPlatformBrand().url;
  try {
    return pickPlatformEmailLogo(await getSiteSettings(), appUrl);
  } catch (error) {
    console.error('[Email] Error resolving platform logo, using the bundled one:', error);
    return builtInEmailLogo(appUrl);
  }
}
