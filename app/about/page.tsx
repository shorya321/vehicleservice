import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getAboutContent } from '@/lib/cms/server'
import { getSiteSettings } from '@/lib/site-settings/server'
import { getSeoSettings } from '@/lib/seo/server'
import { JsonLd } from '@/components/seo/json-ld'
import { ClosingPanel } from '@/components/cms/closing-panel'
import { aboutJsonLd } from './about-json-ld'
import { AboutHero } from './components/about-hero'
import { AboutStory } from './components/about-story'
import { AboutSteps } from './components/about-steps'
import { AboutVetting } from './components/about-vetting'
import { AboutValues } from './components/about-values'
import { AboutCompany } from './components/about-company'
import { AboutPartner } from './components/about-partner'
import { AboutFaq } from './components/about-faq'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/about', PAGE_FALLBACKS['/about'])
}

export default async function AboutPage() {
  const [content, site, seo] = await Promise.all([getAboutContent(), getSiteSettings(), getSeoSettings()])

  return (
    <div className="bg-[var(--black-void)]">
      <JsonLd data={aboutJsonLd(content, site, seo)} />
      <AboutHero content={content.hero} />
      {/* The board's card tokens (bezel shell, core, spring easing) live on
          .blog-board-scope, as on /blog. Without it the cards lose their frame
          and the hover jumps with no easing. */}
      <div className="blog-board-scope">
        {content.story.visible && <AboutStory content={content.story} />}
        {content.steps.visible && <AboutSteps content={content.steps} />}
        {content.vetting.visible && <AboutVetting content={content.vetting} />}
        {content.values.visible && <AboutValues content={content.values} />}
        {content.company.visible && <AboutCompany content={content.company} site={site} />}
        {content.partner.visible && <AboutPartner content={content.partner} />}
        {content.faq.visible && <AboutFaq content={content.faq} />}
        <ClosingPanel />
      </div>
    </div>
  )
}
