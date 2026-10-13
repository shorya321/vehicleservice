import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutImage } from './about-image'
import { BoardHead } from './board-head'

/** Where trips start: the blog's snap rail of tall photo cards. */
export function AboutPlaces({ content }: { content: AboutContent['places'] }) {
  return (
    <section aria-labelledby="about-places-heading" className="blog-board-rail-sec">
      <BoardHead id="about-places-heading" eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      <div className="blog-board-rail">
        {content.items.map((place, index) => (
          <div key={index} className="blog-board-bezel blog-board-pc">
            <div className="blog-board-core blog-board-pc__core">
              <AboutImage src={place.image} alt="" fill className="object-cover" sizes="(max-width: 768px) 70vw, 20rem" />
              <div className="blog-board-pc__lbl">
                <h3>{place.name}</h3>
                {place.note && <span>{place.note}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
