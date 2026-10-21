import { Metadata } from 'next'
import { BadgeCheck, Building2, Clock, Plane, UserRoundCheck, Wallet } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { getServicesContent } from '@/lib/cms/server'
import { JsonLd } from '@/components/seo/json-ld'
import { ClosingPanel } from '@/components/cms/closing-panel'
import { AboutFaq } from '@/app/about/components/about-faq'
import { servicesJsonLd } from './services-json-ld'
import { ServicesHero } from './components/services-hero'
import { ServicesWays } from './components/services-ways'
import { ServicesCards } from './components/services-cards'
import { ServicesHourly } from './components/services-hourly'
import { ServicesFare } from './components/services-fare'
import { ServicesFleet } from './components/services-fleet'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/services', PAGE_FALLBACKS['/services'])
}

/** Fixed by card position. */
const AIRPORT_ICONS = [UserRoundCheck, Clock, Plane]
const BUSINESS_ICONS = [Building2, Wallet, BadgeCheck]

export default async function ServicesPage() {
  const content = await getServicesContent()
  const { airport, beyond, business } = content

  return (
    <div className="bg-[var(--black-void)]">
      <JsonLd data={servicesJsonLd(content)} />
      <ServicesHero content={content.hero} />
      {/* Card tokens (bezel, core, spring easing) live on .blog-board-scope, as on /about. */}
      <div className="blog-board-scope">
        {content.ways.visible && <ServicesWays content={content.ways} />}
        {airport.visible && (
          <ServicesCards
            id="services-airport-heading"
            eyebrow={airport.eyebrow}
            title={airport.title}
            items={airport.items}
            icons={AIRPORT_ICONS}
            note={airport.note}
            link={airport.link}
          />
        )}
        {content.hourly.visible && <ServicesHourly content={content.hourly} />}
        {beyond.visible && (
          <ServicesCards id="services-beyond-heading" eyebrow={beyond.eyebrow} title={beyond.title} items={beyond.items} />
        )}
        {business.visible && (
          <ServicesCards
            id="services-business-heading"
            eyebrow={business.eyebrow}
            title={business.title}
            items={business.items}
            icons={BUSINESS_ICONS}
            actions={[business.primary, business.secondary]}
          />
        )}
        {content.fare.visible && <ServicesFare content={content.fare} />}
        {content.fleet.visible && <ServicesFleet content={content.fleet} />}
        {content.faq.visible && <AboutFaq content={content.faq} />}
        <ClosingPanel />
      </div>
    </div>
  )
}
