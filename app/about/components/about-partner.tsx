import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutTextCard } from './about-text-card'
import { BoardHead } from './board-head'
import { BoardLink } from './board-link'

/** Partner with us: recruits licensed transport companies with spare capacity. */
export function AboutPartner({ content }: { content: AboutContent['partner'] }) {
  return (
    <section aria-labelledby="about-partner-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <BoardHead id="about-partner-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className="luxury-container">
        <ul className="about-board-cards about-board-cards--3">
          {content.items.map((item, index) => (
            <AboutTextCard key={index} title={item.title} body={item.body} />
          ))}
        </ul>
        <div className="about-board-partner-acts">
          <BoardLink cta={content.primary} />
          <BoardLink cta={content.secondary} ghost />
          {content.footnote && <p className="about-board-foot">{content.footnote}</p>}
        </div>
      </div>
    </section>
  )
}
