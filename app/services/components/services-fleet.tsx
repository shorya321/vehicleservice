import type { ServicesContent } from '@/lib/cms/templates/services/schema'
import { BoardLink } from '@/app/about/components/board-link'
import { ServicesHead } from './services-head'

/** The five vehicle classes by seats and bags, ruled like the About numbers. No prices. */
export function ServicesFleet({ content }: { content: ServicesContent['fleet'] }) {
  return (
    <section aria-labelledby="services-fleet-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <ServicesHead id="services-fleet-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className="luxury-container">
        <ul className="services-board-fleet">
          {content.items.map((item) => (
            <li key={item.name}>
              <h3>{item.name}</h3>
              <p className="services-board-fleet__cap numeric">
                <span>Up to <b>{item.seats}</b> seats</span>
                <span><b>{item.bags}</b> bags</span>
              </p>
              <p className="services-board-fleet__models">{item.models}</p>
            </li>
          ))}
        </ul>
        <div className="about-board-acts">
          <BoardLink cta={content.cta} ghost />
        </div>
      </div>
    </section>
  )
}
