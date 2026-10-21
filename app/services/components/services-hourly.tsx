import type { ServicesContent } from '@/lib/cms/templates/services/schema'
import { AboutImage } from '@/app/about/components/about-image'
import { BoardLink } from '@/app/about/components/board-link'
import { ServicesHead } from './services-head'

/** Hourly hire: how it works and its three rules left, the photo right. */
export function ServicesHourly({ content }: { content: ServicesContent['hourly'] }) {
  const hasImage = content.image !== ''

  return (
    <section aria-labelledby="services-hourly-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <ServicesHead id="services-hourly-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className={hasImage ? 'luxury-container about-board-story' : 'luxury-container about-board-story about-board-story--text'}>
        <div>
          <div className="about-board-story__body">
            <p>{content.body}</p>
          </div>
          <dl className="about-board-facts services-board-points">
            {content.points.map((point) => (
              <div key={point.label}>
                <dt>{point.label}</dt>
                <dd>{point.value}</dd>
              </div>
            ))}
          </dl>
          <div className="about-board-acts">
            <BoardLink cta={content.cta} />
          </div>
        </div>
        {hasImage && (
          <div className="blog-board-bezel">
            <div className="blog-board-core about-board-story__photo">
              <AboutImage src={content.image} alt={content.imageAlt} fill className="object-cover" sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
