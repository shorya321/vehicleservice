import { ArrowUpRight, MapPin } from 'lucide-react'
import { CmsLink } from '@/components/cms/cms-link'
import type { AboutContent } from '@/lib/cms/templates/about/schema'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { BoardHead } from './board-head'

interface Fact {
  label: string
  value: string
  href?: string
}

interface AboutCompanyProps {
  content: AboutContent['company']
  site: Pick<SiteSettingsConfig, 'support_phone' | 'support_email' | 'office_address'>
}

function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="about-board-facts">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.href ? <a href={fact.href}>{fact.value}</a> : fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Drops rows the owner has not filled in, so a blank fact never renders. */
const filled = (facts: Fact[]): Fact[] => facts.filter((fact) => fact.value.trim() !== '')

/**
 * The company behind the desk. Contact details come from site settings, the
 * same values the footer shows; legal facts come from this page's content.
 */
export function AboutCompany({ content, site }: AboutCompanyProps) {
  const licence = content.licence && content.licenceIssuer
    ? `${content.licence}, issued by ${content.licenceIssuer}`
    : content.licence

  const company = filled([
    { label: 'Legal name', value: content.legalName },
    { label: 'Trade licence', value: licence },
    { label: 'Office', value: site.office_address },
    { label: 'Founded', value: content.founded },
  ])
  const contact = filled([
    { label: 'Phone / WhatsApp', value: site.support_phone, href: `tel:${site.support_phone.replace(/[^\d+]/g, '')}` },
    { label: 'Bookings and support', value: site.support_email, href: `mailto:${site.support_email}` },
    { label: 'Desk hours', value: content.deskHours },
    { label: 'Payments', value: content.payments },
  ])
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.office_address)}`

  return (
    <section aria-labelledby="about-company-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <BoardHead id="about-company-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className="luxury-container">
        <div className="about-board-company">
          {company.length > 0 && (
            <div className="blog-board-bezel">
              <div className="blog-board-core about-board-card">
                <h3 className="about-board-company__h">Company</h3>
                <FactList facts={company} />
              </div>
            </div>
          )}
          {contact.length > 0 && (
            <div className="blog-board-bezel">
              <div className="blog-board-core about-board-card">
                <h3 className="about-board-company__h">Contact</h3>
                <FactList facts={contact} />
              </div>
            </div>
          )}
          {site.office_address && (
            <a href={mapHref} target="_blank" rel="noopener noreferrer" className="blog-board-bezel about-board-map">
              <div className="blog-board-core about-board-map__core">
                <span className="about-board-map__pin" aria-hidden="true"><MapPin className="h-5 w-5" strokeWidth={1.6} /></span>
                <b>{site.office_address}</b>
                <span className="blog-board-go">
                  Open in Google Maps
                  <span className="blog-board-go__ic"><ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.5} /></span>
                </span>
              </div>
            </a>
          )}
        </div>
        {content.zonesNote && (
          <p className="about-board-foot">
            {content.zonesNote} <CmsLink href={content.zonesLink.href}>{content.zonesLink.label}</CmsLink>
          </p>
        )}
      </div>
    </section>
  )
}
