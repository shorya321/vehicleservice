import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { BoardHead } from './board-head'

/** The standard, set as large numbers in hairline-ruled columns. */
export function AboutValues({ content }: { content: AboutContent['values'] }) {
  return (
    <section aria-labelledby="about-values-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <BoardHead id="about-values-heading" eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      <div className="luxury-container">
        <div className="about-board-values">
          {content.items.map((item, index) => (
            <article key={index}>
              <p className="about-board-values__fig numeric">
                {item.figure}
                {item.unit && <span> {item.unit}</span>}
              </p>
              <h3>{item.title}</h3>
              <p className="about-board-values__body">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
