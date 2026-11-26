import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getLegalContent } from '@/lib/cms/server'
import { DEFAULT_REFUND_CONTENT } from '@/lib/cms/templates/legal/refund-defaults'
import { RefundDocument } from '@/components/legal/refund-document'
import { getSiteSettings } from '@/lib/site-settings/server'
import { getCompanyDetails } from '@/lib/site-settings/company'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/refund', PAGE_FALLBACKS['/refund'])
}

/** Copy is managed under Admin > Pages; the shipped text is the fallback. */
export default async function RefundPolicyPage() {
  const [content, site] = await Promise.all([
    getLegalContent('/refund', DEFAULT_REFUND_CONTENT),
    getSiteSettings(),
  ])
  const { legalName, licence } = getCompanyDetails(site)
  return (
    <RefundDocument
      content={content}
      company={{ legalName, licence, address: site.office_address.trim() }}
      supportEmail={site.support_email}
    />
  )
}
