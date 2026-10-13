import type { AboutContent } from '@/lib/cms/templates/about/schema'
import { AboutImage } from './about-image'
import { BoardHead } from './board-head'

/** How it works: three tall photo cards, the blog rail's card at a fixed size. */
export function AboutSteps({ content }: { content: AboutContent['steps'] }) {
  return (
    <section id="about-how" aria-labelledby="about-how-heading" className="blog-board-rail-sec about-board-steps-sec">
      <BoardHead id="about-how-heading" eyebrow={content.eyebrow} title={content.title} lede={content.lede} />
      <div className="luxury-container">
        <ol className="about-board-steps">
          {content.items.map((step, index) => (
            <li key={index} className="blog-board-bezel blog-board-pc">
              <div className="blog-board-core blog-board-pc__core">
                <AboutImage src={step.image} alt="" fill className="object-cover" sizes="(max-width: 900px) 100vw, 33vw" />
                <span className="blog-board-eyebrow blog-board-eyebrow--dark about-board-steps__tag">
                  <i aria-hidden="true" />{step.tag}
                </span>
                <div className="blog-board-pc__lbl">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
