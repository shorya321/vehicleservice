import { Check, Plus, MessageCircle, type LucideIcon } from 'lucide-react'
import type { ServicesContent } from '@/lib/cms/templates/services/schema'
import { ServicesHead } from './services-head'

interface FareColumn {
  title: string
  icon: LucideIcon
  items: string[]
}

/** What the fare holds, what checkout adds and what the desk arranges, as three lists. */
export function ServicesFare({ content }: { content: ServicesContent['fare'] }) {
  const columns: FareColumn[] = [
    { title: 'Included in every fare', icon: Check, items: content.included.filter(Boolean) },
    { title: 'Add at checkout', icon: Plus, items: content.extras.filter(Boolean) },
    { title: 'On request', icon: MessageCircle, items: content.onRequest.filter(Boolean) },
  ].filter((column) => column.items.length > 0)

  return (
    <section aria-labelledby="services-fare-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <ServicesHead id="services-fare-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className="luxury-container">
        <div className="about-board-cards about-board-cards--3">
          {columns.map(({ title, icon: Icon, items }) => (
            <div key={title} className="blog-board-bezel">
              <div className="blog-board-core about-board-card">
                <h3>{title}</h3>
                <ul className="services-board-list">
                  {items.map((item) => (
                    <li key={item}>
                      <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        {content.footnote && <p className="about-board-foot">{content.footnote}</p>}
      </div>
    </section>
  )
}
