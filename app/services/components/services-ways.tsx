import { ArrowUpRight } from 'lucide-react'
import { CmsLink } from '@/components/cms/cms-link'
import type { ServicesContent } from '@/lib/cms/templates/services/schema'
import { AboutImage } from '@/app/about/components/about-image'
import { ServicesHead } from './services-head'

/** Four ways to book: one photo card per search-bar tab, each opening its search. */
export function ServicesWays({ content }: { content: ServicesContent['ways'] }) {
  return (
    <section aria-labelledby="services-ways-heading" className="blog-board-rail-sec about-board-steps-sec">
      <ServicesHead id="services-ways-heading" eyebrow={content.eyebrow} title={content.title} />
      <div className="luxury-container">
        <ul className="about-board-steps services-board-ways">
          {content.items.map((item, index) => (
            <li key={index} className="blog-board-bezel blog-board-pc">
              <div className="blog-board-core blog-board-pc__core">
                <AboutImage src={item.image} alt="" fill className="object-cover" sizes="(max-width: 900px) 100vw, 25vw" />
                <div className="blog-board-pc__lbl">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <CmsLink href={item.cta.href} className="blog-board-go services-board-ways__go">
                    {item.cta.label}
                    <span className="blog-board-go__ic" aria-hidden="true">
                      <ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.5} />
                    </span>
                  </CmsLink>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
