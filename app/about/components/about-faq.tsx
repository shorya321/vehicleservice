import { Plus } from 'lucide-react'
import type { AboutContent } from '@/lib/cms/templates/about/schema'

/** Questions about us. The same items feed the page's FAQPage structured data. */
export function AboutFaq({ content }: { content: AboutContent['faq'] }) {
  return (
    <section aria-labelledby="about-faq-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <div className="luxury-container about-board-faq">
        <div>
          <p className="blog-board-eyebrow"><i aria-hidden="true" />{content.eyebrow}</p>
          <h2 id="about-faq-heading" className="blog-board-h2">{content.title}</h2>
        </div>
        <div className="about-board-faq__list">
          {content.items.map((item, index) => (
            <details key={index} className="about-board-faq__item" open={index === 0}>
              <summary>
                <h3>{item.question}</h3>
                <span className="about-board-faq__ic" aria-hidden="true">
                  <Plus className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
