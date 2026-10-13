import { ArrowUpRight } from 'lucide-react'
import { CmsLink } from '@/components/cms/cms-link'
import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutImage } from './about-image'
import { BoardLink } from './board-link'

/** Blog board hero: title, actions and figures left; featured photo with two floating cards right. */
export function AboutHero({ content }: { content: AboutContent['hero'] }) {
  const { feature, note, stat } = content

  return (
    <section aria-labelledby="about-heading" className="blog-board-hero">
      <div className="luxury-container blog-board-hero__grid">
        <div className="blog-hero-animate">
          <p className="blog-hero__eyebrow blog-board-eyebrow"><i aria-hidden="true" />{content.eyebrow}</p>
          <h1 id="about-heading" className="blog-hero__title blog-board-title">
            {content.title}
            {content.accent && <> <span>{content.accent}</span></>}
          </h1>
          <p className="blog-hero__subtitle blog-board-sub">{content.body}</p>
          <div className="blog-hero__search">
            <div className="about-board-acts">
              <BoardLink cta={content.primary} />
              <BoardLink cta={content.secondary} ghost />
            </div>
            <dl className="blog-board-figures numeric">
              {content.figures.map((figure, index) => (
                <div key={index}>
                  <dt>{figure.label}</dt>
                  <dd>{figure.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="blog-board-feature blog-hero-animate">
          <div className="blog-board-bezel blog-board-feature__card blog-hero__search">
            <div className="blog-board-core blog-board-feature__core">
              <AboutImage
                src={feature.image}
                alt={feature.alt}
                fill
                priority
                className="blog-board-feature__img object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              <div className="blog-board-feature__shade" aria-hidden="true" />
              <span className="blog-board-eyebrow blog-board-eyebrow--glass blog-board-feature__tag">
                <i aria-hidden="true" />{feature.tag}
              </span>
              <div className="blog-board-feature__label">
                <span className="blog-board-eyebrow blog-board-eyebrow--dark"><i aria-hidden="true" />{feature.eyebrow}</span>
                <h2>{feature.title}</h2>
                {(feature.metaStart || feature.metaEnd) && (
                  <div className="blog-board-feature__meta numeric">
                    {feature.metaStart && <span>{feature.metaStart}</span>}
                    {feature.metaEnd && <span>{feature.metaEnd}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CmsLink href={note.href} className="blog-board-bezel blog-board-float blog-board-float--a">
            <div className="blog-board-core blog-board-float__core">
              <p className="line-clamp-2">{note.text}</p>
              <span className="blog-board-go">
                {note.label}
                <span className="blog-board-go__ic"><ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.5} /></span>
              </span>
            </div>
          </CmsLink>

          <div className="blog-board-bezel blog-board-float blog-board-float--b" aria-hidden="true">
            <div className="blog-board-core blog-board-float__core">
              <span className="blog-board-eyebrow"><i />{stat.eyebrow}</span>
              <b className="numeric">{stat.value}</b>
              <small>{stat.caption}</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
