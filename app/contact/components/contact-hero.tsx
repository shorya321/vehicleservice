const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]'

export function ContactHero() {
  return (
    <section className="editorial-section editorial-section--ground editorial-section--compact">
      <div className="luxury-container">
        <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />Get in touch</p>

        <h1 className="editorial-section-title mt-5 max-w-[28ch]">
          Talk to the people who run the transfer.
        </h1>

        <p className="editorial-body mt-6">
          Questions about a booking, corporate accounts, or feedback on a journey you have
          already taken. Every message reaches the concierge desk in Business Bay.
        </p>

        <dl className="trip-ledger mt-10">
          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">Reply</dt>
            <dd className="trip-ledger__value">Within 24 hours</dd>
          </div>

          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">Desk</dt>
            <dd className="trip-ledger__value numeric">Open 24 / 7</dd>
          </div>

          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">Email</dt>
            <dd className="trip-ledger__value">
              <a
                href="mailto:info@infiniatransfers.com"
                className={`text-[var(--text-primary)] hover:text-[var(--gold-text-hover)] rounded-[2px] link-underline-grow ${FOCUS_RING}`}
              >
                info@infiniatransfers.com
              </a>
            </dd>
          </div>

          <div className="trip-ledger__item sm:ml-auto">
            <dt className="trip-ledger__label">Phone</dt>
            <dd className="trip-ledger__value numeric">
              <a
                href="tel:+971501234567"
                className={`text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] rounded-[2px] link-underline-grow ${FOCUS_RING}`}
              >
                +971 50 123 4567
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
