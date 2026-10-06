import type { SiteSettingsConfig } from '@/lib/site-settings/types'

export interface ContactDetails {
  email: string
  phone: string
  /** `tel:` target: the number with spaces and punctuation removed. */
  phoneHref: string
  /** Office address split for display, e.g. ["Business Bay, Dubai", "United Arab Emirates"]. */
  officeLines: string[]
}

/**
 * Contact details as Settings > General holds them. The address breaks before
 * its last comma, which is how the page always set it: area and city on one
 * line, country on the next.
 */
export function contactDetailsFrom(site: SiteSettingsConfig): ContactDetails {
  const email = site.info_email || site.support_email
  const phone = site.support_phone
  const address = site.office_address.trim()
  const cut = address.lastIndexOf(',')
  const officeLines =
    cut > 0 ? [address.slice(0, cut).trim(), address.slice(cut + 1).trim()] : address ? [address] : []

  return { email, phone, phoneHref: `tel:${phone.replace(/[^\d+]/g, '')}`, officeLines }
}
