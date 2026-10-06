const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]'

import type { ContactContent } from '@/lib/cms/templates/contact/schema'
import type { ContactDetails } from '@/lib/cms/templates/contact/details'

interface ContactHeroProps {
  content: ContactContent['hero']
  details: ContactDetails
}

export function ContactHero({ content, details }: ContactHeroProps) {
  return (
    <section className="editorial-section editorial-section--ground editorial-section--compact">
      <div className="luxury-container">
        <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />{content.eyebrow}</p>

        <h1 className="editorial-section-title mt-5 max-w-[28ch]">
          {content.title}
        </h1>

        {content.body && <p className="editorial-body mt-6">{content.body}</p>}

        <dl className="trip-ledger mt-10">
          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">{content.reply.label}</dt>
            <dd className="trip-ledger__value">{content.reply.value}</dd>
          </div>

          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">{content.desk.label}</dt>
            <dd className="trip-ledger__value numeric">{content.desk.value}</dd>
          </div>

          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">Email</dt>
            <dd className="trip-ledger__value">
              <a
                href={`mailto:${details.email}`}
                className={`text-[var(--text-primary)] hover:text-[var(--gold-text-hover)] rounded-[2px] link-underline-grow ${FOCUS_RING}`}
              >
                {details.email}
              </a>
            </dd>
          </div>

          <div className="trip-ledger__item sm:ml-auto">
            <dt className="trip-ledger__label">Phone</dt>
            <dd className="trip-ledger__value numeric">
              <a
                href={details.phoneHref}
                className={`text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] rounded-[2px] link-underline-grow ${FOCUS_RING}`}
              >
                {details.phone}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
