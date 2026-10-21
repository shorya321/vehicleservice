import { Ban, Car, ScrollText, ShieldCheck } from 'lucide-react'
import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutTextCard } from './about-text-card'
import { BoardHead } from './board-head'

/** Fixed by position: licence, insurance, vehicle condition, removal. */
const ICONS = [ScrollText, ShieldCheck, Car, Ban]

/** How we vet partners: the four checks the Terms name, one card each. */
export function AboutVetting({ content }: { content: AboutContent['vetting'] }) {
  return (
    <section aria-labelledby="about-vetting-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <BoardHead id="about-vetting-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className="luxury-container">
        <ul className="about-board-cards about-board-cards--4">
          {content.items.map((item, index) => (
            <AboutTextCard key={index} title={item.title} body={item.body} icon={ICONS[index]} />
          ))}
        </ul>
        {content.footnote && <p className="about-board-foot">{content.footnote}</p>}
      </div>
    </section>
  )
}
