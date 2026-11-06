import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { formatLicence, getCompanyDetails, type CompanyDetails, type CompanySettings } from '@/lib/site-settings/company'

/**
 * Legal name and licence for the About page. A value typed on the page itself
 * (Admin > Pages > About) wins; an empty one falls back to Settings > General,
 * so the details only have to be entered once.
 */
export function resolveAboutCompany(
  content: Pick<AboutContent['company'], 'legalName' | 'licence' | 'licenceIssuer'>,
  site: CompanySettings
): CompanyDetails {
  const fromSettings = getCompanyDetails(site)
  const pageLicence = formatLicence(content.licence, content.licenceIssuer)

  return {
    legalName: content.legalName?.trim() || fromSettings.legalName,
    licence: pageLicence || fromSettings.licence,
  }
}
