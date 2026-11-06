import type { SiteSettingsConfig } from './types'

/**
 * The registered company details from Settings > General, in display form.
 *
 * Every field is optional. Callers render nothing for an empty value, so the
 * site looks exactly as before until the owner fills these in.
 *
 * Isomorphic on purpose (no server imports): the admin email preview renders
 * in the browser and the footer is shared by server pages.
 */
export type CompanySettings = Pick<
  SiteSettingsConfig,
  'legal_name' | 'trade_licence_number' | 'licence_issuer'
>

export interface CompanyDetails {
  legalName: string
  /** "123456, issued by Dubai DET", or just the number. Empty when no number is set. */
  licence: string
}

const clean = (value: string | null | undefined): string =>
  typeof value === 'string' ? value.trim() : ''

/**
 * An issuer on its own says nothing, so it is only shown next to a number.
 */
export function formatLicence(number: string | null | undefined, issuer: string | null | undefined): string {
  const n = clean(number)
  const i = clean(issuer)
  if (!n) return ''
  return i ? `${n}, issued by ${i}` : n
}

export function getCompanyDetails(settings: Partial<CompanySettings> | null | undefined): CompanyDetails {
  return {
    legalName: clean(settings?.legal_name),
    licence: formatLicence(settings?.trade_licence_number, settings?.licence_issuer),
  }
}

export function hasCompanyDetails(details: CompanyDetails): boolean {
  return details.legalName !== '' || details.licence !== ''
}

/**
 * One line for footers and documents, e.g.
 * "Operated by Infinia Transfers LLC, trade licence 123456, issued by Dubai DET".
 * Empty string when nothing is set.
 */
export function companyLegalLine(settings: Partial<CompanySettings> | null | undefined): string {
  const { legalName, licence } = getCompanyDetails(settings)
  if (legalName && licence) return `Operated by ${legalName}, trade licence ${licence}`
  if (legalName) return `Operated by ${legalName}`
  if (licence) return `Trade licence ${licence}`
  return ''
}

/** Ends text with exactly one full stop, so joined lines never read "Ltd.." or run on. */
export function asSentence(text: string): string {
  const body = text.trim().replace(/[.\s]+$/, '')
  return body ? `${body}.` : ''
}
