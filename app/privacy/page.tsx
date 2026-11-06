import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getLegalContent } from '@/lib/cms/server'
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/cms/templates/legal/privacy-defaults'
import { LegalDocument } from '@/components/legal/legal-document'
import { getSiteSettings } from '@/lib/site-settings/server'
import { getCompanyDetails } from '@/lib/site-settings/company'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/privacy', PAGE_FALLBACKS['/privacy'])
}

/** Copy is managed under Admin > Pages; the shipped text is the fallback. */
export default async function PrivacyPage() {
  const [content, site] = await Promise.all([
    getLegalContent('/privacy', DEFAULT_PRIVACY_CONTENT),
    getSiteSettings(),
  ])
  const { legalName, licence } = getCompanyDetails(site)
  return (
    <LegalDocument
      content={content}
      company={{ legalName, licence, address: site.office_address.trim() }}
    />
  )
}
