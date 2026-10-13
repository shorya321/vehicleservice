import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutImage } from './about-image'
import { BoardLink } from './board-link'

/** Closing plate, the blog's "Know the road" panel with two tilted photos. */
export function AboutClose({ content }: { content: AboutContent['close'] }) {
  const trust = content.trust.filter(Boolean)

  return (
    <section aria-labelledby="about-close-heading" className="luxury-container blog-board-close-sec">
      <div className="blog-board-bezel blog-board-close">
        <div className="blog-board-core blog-board-close__core">
          <div>
            <p className="blog-board-eyebrow"><i aria-hidden="true" />{content.eyebrow}</p>
            <h2 id="about-close-heading" className="blog-board-close__title">{content.title}</h2>
            {content.body && <p className="blog-board-close__body">{content.body}</p>}
            <div className="blog-board-close__acts">
              <BoardLink cta={content.primary} />
              <BoardLink cta={content.secondary} ghost />
            </div>
            {trust.length > 0 && (
              <p className="blog-board-trust">
                {trust.map((line, index) => <span key={index}>{line}</span>)}
              </p>
            )}
          </div>
          <div className="blog-board-close__photos" aria-hidden="true">
            {content.images.map((src, index) => (
              <AboutImage key={index} src={src} alt="" width={480} height={600} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
