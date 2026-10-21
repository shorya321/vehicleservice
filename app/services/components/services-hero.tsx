import type { ServicesContent } from '@/lib/cms/templates/services/schema'
import { AboutImage } from '@/app/about/components/about-image'
import { BoardLink } from '@/app/about/components/board-link'

/** Board hero: H1, the one-line promise, two actions and three chips; one photo right. */
export function ServicesHero({ content }: { content: ServicesContent['hero'] }) {
  const chips = content.chips.filter(Boolean)

  return (
    <section aria-labelledby="services-heading" className="blog-board-hero">
      <div className="luxury-container blog-board-hero__grid">
        <div className="blog-hero-animate">
          <p className="blog-hero__eyebrow blog-board-eyebrow"><i aria-hidden="true" />{content.eyebrow}</p>
          <h1 id="services-heading" className="blog-hero__title blog-board-title">
            {content.title}
            {content.accent && <> <span>{content.accent}</span></>}
          </h1>
          <p className="blog-hero__subtitle blog-board-sub">{content.body}</p>
          <div className="blog-hero__search">
            <div className="about-board-acts">
              <BoardLink cta={content.primary} />
              <BoardLink cta={content.secondary} ghost />
            </div>
            {chips.length > 0 && (
              <p className="blog-board-trust services-board-chips">
                {chips.map((chip, index) => <span key={index}>{chip}</span>)}
              </p>
            )}
          </div>
        </div>

        <div className="blog-board-feature blog-hero-animate">
          <div className="blog-board-bezel blog-board-feature__card blog-hero__search">
            <div className="blog-board-core blog-board-feature__core">
              <AboutImage
                src={content.image}
                alt={content.imageAlt}
                fill
                priority
                className="blog-board-feature__img object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              <div className="blog-board-feature__shade" aria-hidden="true" />
              <span className="blog-board-eyebrow blog-board-eyebrow--glass blog-board-feature__tag">
                <i aria-hidden="true" />{content.imageTag}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
