import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutImage } from './about-image'
import { BoardHead } from './board-head'

/** Our story: heading and two short paragraphs left, the founder or team photo right. */
export function AboutStory({ content }: { content: AboutContent['story'] }) {
  const paragraphs = content.paragraphs.filter(Boolean)
  const hasImage = content.image !== ''

  return (
    <section aria-labelledby="about-story-heading" className="editorial-section editorial-section--ground bg-[var(--black-void)]">
      <div className={hasImage ? 'luxury-container about-board-story' : 'luxury-container about-board-story about-board-story--text'}>
        <div>
          <BoardHead id="about-story-heading" eyebrow={content.eyebrow} title={content.title} className="about-board-story__head" />
          <div className="about-board-story__body">
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
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
