/**
 * The colour a business's PDFs print in: its brand accent from theme_config, the same value
 * the quotation PDF uses (see lib/business/quotations/pdf-payload.ts). theme_config is JSONB
 * and arbitrary, so anything but a plain 6-digit hex falls back to the default accent.
 */

import { parseThemeConfig, DEFAULT_THEME_CONFIG } from '@/lib/business/branding-utils';
import { safeHexColor } from '@/lib/business/quotations/brand-logo';

export function businessPdfColor(themeConfig: unknown): string {
  return safeHexColor(
    parseThemeConfig(themeConfig)?.accent?.primary,
    DEFAULT_THEME_CONFIG.accent.primary
  );
}
