import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getAboutContent } from '@/lib/cms/server'
import { AboutHero } from './components/about-hero'
import { AboutSteps } from './components/about-steps'
import { AboutValues } from './components/about-values'
import { AboutPlaces } from './components/about-places'
import { ClosingPanel } from '@/components/cms/closing-panel'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/about', PAGE_FALLBACKS['/about'])
}

export default async function AboutPage() {
  const content = await getAboutContent()

  return (
    <div className="bg-[var(--black-void)]">
      <AboutHero content={content.hero} />
      {/* The board's card tokens (bezel shell, core, spring easing) live on
          .blog-board-scope, as on /blog. Without it the cards lose their frame
          and the hover jumps with no easing. */}
      <div className="blog-board-scope">
        {content.steps.visible && <AboutSteps content={content.steps} />}
        {content.values.visible && <AboutValues content={content.values} />}
        {content.places.visible && <AboutPlaces content={content.places} />}
        <ClosingPanel />
      </div>
    </div>
  )
}
