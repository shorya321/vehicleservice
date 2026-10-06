import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getLegalContent } from '@/lib/cms/server'
import { DEFAULT_TERMS_CONTENT } from '@/lib/cms/templates/legal/terms-defaults'
import { LegalDocument } from '@/components/legal/legal-document'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/terms', PAGE_FALLBACKS['/terms'])
}

/** Copy is managed under Admin > Pages; the shipped text is the fallback. */
export default async function TermsPage() {
  const content = await getLegalContent('/terms', DEFAULT_TERMS_CONTENT)
  return <LegalDocument content={content} />
}
