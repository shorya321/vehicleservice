import 'server-only';
import { readFile } from 'fs/promises';
import path from 'path';
import { getSiteSettings } from '@/lib/site-settings/server';
import { BUILT_IN_LOGOS, resolveSiteLogo } from '@/lib/site-settings/logo';
// Read-only reuse of the quotation fetcher: PNG/JPEG only, size and time bounded, never throws.
import { resolveBrandLogo } from '@/lib/business/quotations/brand-logo';
import type { PdfImageBytes } from './utils/image';

/** Light-background artwork: the PDF header draws the logo on a white chip. */
const BUNDLED_LOGO_FILE = path.join(process.cwd(), 'public', BUILT_IN_LOGOS.horizontal.light);

let bundled: Promise<PdfImageBytes | null> | null = null;

function readBundledLogo(): Promise<PdfImageBytes | null> {
  bundled ??= readFile(BUNDLED_LOGO_FILE)
    .then((data): PdfImageBytes => ({ data, format: 'png' }))
    .catch((error: unknown) => {
      console.error('[PDF] Bundled logo unreadable, invoice falls back to text:', error);
      bundled = null;
      return null;
    });
  return bundled;
}

/**
 * The admin logo (Settings > admin logo) for platform documents such as the customer
 * invoice. Never throws: an unreadable upload or settings failure falls back to the
 * bundled artwork, and null only when even that is missing, which the header renders
 * as the company name.
 */
export async function loadPlatformPdfLogo(): Promise<PdfImageBytes | null> {
  try {
    const admin = resolveSiteLogo(await getSiteSettings(), 'admin');
    if (admin.custom) {
      const upload = await resolveBrandLogo(admin.light);
      if (upload) return upload;
    }
  } catch (error) {
    console.error('[PDF] Admin logo unavailable, using the bundled one:', error);
  }
  return readBundledLogo();
}
