import 'server-only';
import { getSiteSettings } from '@/lib/site-settings/server';
import { companyLegalLine } from '@/lib/site-settings/company';

export interface PlatformPdfCompany {
  /** Office address from Settings > General, or undefined to print no line. */
  companyAddress?: string;
  /** "Operated by <legal name>, trade licence <no.>", or undefined to print no line. */
  companyLegalLine?: string;
}

/**
 * The issuer's address and company line for platform documents such as the customer
 * invoice. Never throws: a settings failure prints neither line, so the invoice still
 * downloads, and it never falls back to a made-up address.
 */
export async function loadPlatformPdfCompany(): Promise<PlatformPdfCompany> {
  try {
    const settings = await getSiteSettings();
    return {
      companyAddress: settings.office_address.trim() || undefined,
      companyLegalLine: companyLegalLine(settings) || undefined,
    };
  } catch (error) {
    console.error('[PDF] Company details unavailable, invoice prints without them:', error);
    return {};
  }
}
