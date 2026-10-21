import type { LucideIcon } from 'lucide-react'
import type { Cta } from '@/lib/cms/fields'
import { CmsLink } from '@/components/cms/cms-link'
import { AboutTextCard } from '@/app/about/components/about-text-card'
import { BoardLink } from '@/app/about/components/board-link'
import { ServicesHead } from './services-head'

interface ServicesCardsProps {
  id: string
  eyebrow: string
  title: string
  items: { title: string; body: string }[]
  icons?: LucideIcon[]
  /** Text before the trailing link, e.g. "Full guide:". */
  note?: string
  link?: Cta
  actions?: [Cta, Cta]
}

/** A board section of short text cards: airport, beyond Dubai and business share it. */
export function ServicesCards({ id, eyebrow, title, items, icons, note, link, actions }: ServicesCardsProps) {
  const columns = items.length === 2 ? 'about-board-cards--2' : 'about-board-cards--3'

  return (
    <section aria-labelledby={id} className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <ServicesHead id={id} eyebrow={eyebrow} title={title} />
      <div className="luxury-container">
        <ul className={`about-board-cards ${columns}`}>
          {items.map((item, index) => (
            <AboutTextCard key={index} title={item.title} body={item.body} icon={icons?.[index]} />
          ))}
        </ul>
        {actions && (
          <div className="about-board-partner-acts">
            <BoardLink cta={actions[0]} />
            <BoardLink cta={actions[1]} ghost />
          </div>
        )}
        {link && (
          <p className="about-board-foot">
            {note} <CmsLink href={link.href}>{link.label}</CmsLink>
          </p>
        )}
      </div>
    </section>
  )
}
