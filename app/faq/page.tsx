import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getFaqContent } from '@/lib/cms/server'
import { faqTopicIds } from '@/lib/cms/templates/faq/parse'
import { getSiteSettings } from '@/lib/site-settings/server'
import { faqPageJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/components/seo/json-ld'
import { FaqExplorer } from './components/faq-explorer'
import { FaqHelp, FAQ_HELP_ID } from './components/faq-help'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/faq', PAGE_FALLBACKS['/faq'])
}

export default async function FaqPage() {
  const [content, site] = await Promise.all([getFaqContent(), getSiteSettings()])
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
          helpHref={content.help.visible ? `#${FAQ_HELP_ID}` : null}
        />
        {content.help.visible && <FaqHelp content={content.help} email={site.support_email} />}
      </div>
    </div>
  )
}
