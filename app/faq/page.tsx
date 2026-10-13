import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getFaqContent } from '@/lib/cms/server'
import { faqTopicIds } from '@/lib/cms/templates/faq/parse'
import { faqPageJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/components/seo/json-ld'
import { FaqExplorer } from './components/faq-explorer'
import { ClosingPanel } from '@/components/cms/closing-panel'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/faq', PAGE_FALLBACKS['/faq'])
}

export default async function FaqPage() {
  const content = await getFaqContent()
  const faqJsonLd = faqPageJsonLd(content.topics.flatMap((topic) => topic.items))

  return (
    <div className="bg-[var(--black-void)]">
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      {/* Card tokens (bezel shell, core, spring easing) live on .blog-board-scope, as on /about. */}
      <div className="blog-board-scope">
        <FaqExplorer
          hero={content.hero}
          topics={content.topics}
          topicIds={faqTopicIds(content.topics)}
        />
        <ClosingPanel />
      </div>
    </div>
  )
}
