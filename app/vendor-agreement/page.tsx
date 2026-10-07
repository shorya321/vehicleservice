import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getPublishedPage } from '@/lib/cms/server'
import { parseLegalContent } from '@/lib/cms/templates/legal/parse'
import { DEFAULT_VENDOR_AGREEMENT_CONTENT } from '@/lib/cms/templates/legal/vendor-agreement-defaults'
import { LegalDocument } from '@/components/legal/legal-document'

const SLUG = '/vendor-agreement'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata(SLUG, PAGE_FALLBACKS[SLUG])
}

/**
 * Copy is managed under Admin > Pages. Unlike Terms and Privacy this page ships
 * as a draft, so it 404s until an admin publishes it: the default copy is a
 * starting point for legal review, not something to show before that.
 */
export default async function VendorAgreementPage() {
  const page = await getPublishedPage(SLUG)
  if (!page) {
    notFound()
  }
  return <LegalDocument content={parseLegalContent(page.content, DEFAULT_VENDOR_AGREEMENT_CONTENT)} />
}
