import { getSiteSettings } from '@/lib/site-settings/server';
import { companyLegalLine } from '@/lib/site-settings/company';
import type { PlatformEmailDetails } from '../transport/types';

export type { PlatformEmailDetails };

const NONE: PlatformEmailDetails = { address: '', legalLine: '' };

/**
 * The platform's postal address and company line for email footers.
 *
 * Never throws: a settings failure returns empty values, so the footer shows the brand
 * name only and the email still goes out. It never falls back to a made-up address.
 */
export async function getPlatformEmailDetails(): Promise<PlatformEmailDetails> {
  try {
    const settings = await getSiteSettings();
    return {
      address: settings.office_address.trim(),
      legalLine: companyLegalLine(settings),
    };
  } catch (error) {
    console.error('[Email] Platform company details unavailable, sending without them:', error);
    return NONE;
  }
}
