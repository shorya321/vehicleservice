import { DEFAULT_BOOKING_TIMEZONE, isValidTimezone } from '@/lib/utils/timezone'

/**
 * Default self-cancellation window for business bookings, in minutes.
 *
 * Lives here rather than in the business module because it is the default of a
 * platform setting, and `lib/site-settings` must not depend on `lib/business`.
 * `getCancellationEligibility` takes the window as a required argument, so it
 * never needs a fallback of its own.
 */
export const DEFAULT_CANCELLATION_WINDOW_MINUTES = 30

export interface SocialLinks {
  instagram: string
  facebook: string
  twitter: string
  linkedin: string
  youtube: string
  tiktok: string
}

export interface SiteSettingsConfig {
  brand_name: string
  header_logo_url: string | null
  footer_logo_url: string | null
  copyright_text: string
  support_email: string
  info_email: string
  bookings_email: string
  support_phone: string
  secondary_phone: string
  office_address: string
  social_links: SocialLinks
  maintenance_mode: boolean
  block_search_indexing: boolean
  /**
   * IANA name of the operating timezone: the wall-clock every booking, report
   * and day boundary is expressed in. See `lib/utils/timezone.ts`.
   */
  timezone: string
  /**
   * How long after creating a booking a business may still cancel it themselves,
   * in minutes. Outside that window, and whenever a vendor has already been
   * assigned, cancelling is a support conversation instead.
   *
   * 0 disables business self-cancellation entirely. See
   * `getCancellationEligibility` in `lib/business/booking-utils.ts`.
   */
  business_cancellation_window_minutes: number
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: '',
  facebook: '',
  twitter: '',
  linkedin: '',
  youtube: '',
  tiktok: '',
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsConfig = {
  brand_name: 'Infinia Transfers',
  header_logo_url: null,
  footer_logo_url: null,
  copyright_text: 'Infinia Transfers',
  support_email: 'support@infiniatransfers.com',
  info_email: 'info@infiniatransfers.com',
  bookings_email: 'bookings@infiniatransfers.com',
  support_phone: '+971 50 123 4567',
  secondary_phone: '+971 4 123 4567',
  office_address: 'Business Bay, Dubai, United Arab Emirates',
  social_links: DEFAULT_SOCIAL_LINKS,
  maintenance_mode: false,
  block_search_indexing: true,
  timezone: DEFAULT_BOOKING_TIMEZONE,
  business_cancellation_window_minutes: DEFAULT_CANCELLATION_WINDOW_MINUTES,
}

export function parseSiteSettings(raw: unknown): SiteSettingsConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SITE_SETTINGS
  }

  const obj = raw as Record<string, unknown>

  const socialRaw = obj.social_links
  const social: SocialLinks = {
    instagram: typeof (socialRaw as Record<string, unknown>)?.instagram === 'string'
      ? (socialRaw as Record<string, unknown>).instagram as string
      : DEFAULT_SOCIAL_LINKS.instagram,
    facebook: typeof (socialRaw as Record<string, unknown>)?.facebook === 'string'
      ? (socialRaw as Record<string, unknown>).facebook as string
      : DEFAULT_SOCIAL_LINKS.facebook,
    twitter: typeof (socialRaw as Record<string, unknown>)?.twitter === 'string'
      ? (socialRaw as Record<string, unknown>).twitter as string
      : DEFAULT_SOCIAL_LINKS.twitter,
    linkedin: typeof (socialRaw as Record<string, unknown>)?.linkedin === 'string'
      ? (socialRaw as Record<string, unknown>).linkedin as string
      : DEFAULT_SOCIAL_LINKS.linkedin,
    youtube: typeof (socialRaw as Record<string, unknown>)?.youtube === 'string'
      ? (socialRaw as Record<string, unknown>).youtube as string
      : DEFAULT_SOCIAL_LINKS.youtube,
    tiktok: typeof (socialRaw as Record<string, unknown>)?.tiktok === 'string'
      ? (socialRaw as Record<string, unknown>).tiktok as string
      : DEFAULT_SOCIAL_LINKS.tiktok,
  }

  return {
    brand_name: typeof obj.brand_name === 'string' ? obj.brand_name : DEFAULT_SITE_SETTINGS.brand_name,
    header_logo_url: typeof obj.header_logo_url === 'string' ? obj.header_logo_url : null,
    footer_logo_url: typeof obj.footer_logo_url === 'string' ? obj.footer_logo_url : null,
    copyright_text: typeof obj.copyright_text === 'string' ? obj.copyright_text : DEFAULT_SITE_SETTINGS.copyright_text,
    support_email: typeof obj.support_email === 'string' ? obj.support_email : DEFAULT_SITE_SETTINGS.support_email,
    info_email: typeof obj.info_email === 'string' ? obj.info_email : DEFAULT_SITE_SETTINGS.info_email,
    bookings_email: typeof obj.bookings_email === 'string' ? obj.bookings_email : DEFAULT_SITE_SETTINGS.bookings_email,
    support_phone: typeof obj.support_phone === 'string' ? obj.support_phone : DEFAULT_SITE_SETTINGS.support_phone,
    secondary_phone: typeof obj.secondary_phone === 'string' ? obj.secondary_phone : DEFAULT_SITE_SETTINGS.secondary_phone,
    office_address: typeof obj.office_address === 'string' ? obj.office_address : DEFAULT_SITE_SETTINGS.office_address,
    social_links: social,
    maintenance_mode: typeof obj.maintenance_mode === 'boolean' ? obj.maintenance_mode : false,
    // Missing key = blocked. Safe pre-launch default so demo content is never crawled.
    block_search_indexing: typeof obj.block_search_indexing === 'boolean' ? obj.block_search_indexing : true,
    // Validated here rather than trusted: an unresolvable zone would otherwise
    // throw inside every date on the site.
    timezone:
      typeof obj.timezone === 'string' && isValidTimezone(obj.timezone)
        ? obj.timezone
        : DEFAULT_BOOKING_TIMEZONE,
    // A whole, non-negative count of minutes or nothing. A stray float or a
    // negative would otherwise read as "window already closed" for every
    // booking, silently switching self-cancellation off site-wide.
    business_cancellation_window_minutes:
      typeof obj.business_cancellation_window_minutes === 'number' &&
      Number.isFinite(obj.business_cancellation_window_minutes) &&
      obj.business_cancellation_window_minutes >= 0
        ? Math.floor(obj.business_cancellation_window_minutes)
        : DEFAULT_CANCELLATION_WINDOW_MINUTES,
  }
}
