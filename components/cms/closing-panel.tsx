import { getClosingPanel } from '@/lib/cms/blocks/server'
import { AboutImage } from '@/app/about/components/about-image'
import { BoardLink } from '@/app/about/components/board-link'

/**
 * The closing panel above the footer on Blog, About and FAQ. One copy, edited
 * under Admin > Pages > Shared sections. Must sit inside .blog-board-scope (or
 * another scope that sets the --bb-* card tokens) to keep its frame.
 */
export async function ClosingPanel() {
  const content = await getClosingPanel()
  if (!content.visible) {
    return null
  }
  const trust = content.trust.filter(Boolean)

  return (
    <section aria-labelledby="closing-panel-heading" className="luxury-container blog-board-close-sec">
      <div className="blog-board-bezel blog-board-close">
        <div className="blog-board-core blog-board-close__core">
          <div>
            <p className="blog-board-eyebrow">
              <i aria-hidden="true" />
              {content.eyebrow}
            </p>
            <h2 id="closing-panel-heading" className="blog-board-close__title">{content.title}</h2>
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
              <AboutImage key={index} src={src} alt={content.imageAlts[index] ?? ''} width={480} height={600} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
