import { Search } from 'lucide-react'
import type { FaqContent } from '@/lib/cms/templates/faq/schema'
import type { FaqRailTopic } from './faq-rail'

interface FaqHeroProps {
  content: FaqContent['hero']
  topics: FaqRailTopic[]
  term: string
  onTermChange: (term: string) => void
  /** Shown inside the search pill: total answers, or matches while searching. */
  countLabel: string
}

/** Single-column blog-board hero with a live, in-page search and topic chips. */
export function FaqHero({ content, topics, term, onTermChange, countLabel }: FaqHeroProps) {
  return (
    <section aria-labelledby="faq-heading" className="blog-board-hero">
      <div className="luxury-container blog-board-hero__grid blog-board-hero__grid--single">
        <div className="blog-hero-animate">
          <p className="blog-hero__eyebrow blog-board-eyebrow">
            <i aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h1 id="faq-heading" className="blog-hero__title blog-board-title">
            {content.title}
            {content.accent && <> <span>{content.accent}</span></>}
          </h1>
          <p className="blog-hero__subtitle blog-board-sub">{content.body}</p>
          <div className="blog-hero__search">
            <div role="search" className="blog-board-bezel blog-board-search faq-page__search">
              <div className="blog-board-core blog-board-search__core">
                <Search className="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                <label htmlFor="faq-search" className="sr-only">Search questions</label>
                <input
                  id="faq-search"
                  type="search"
                  placeholder="Search, e.g. flight delayed"
                  autoComplete="off"
                  value={term}
                  onChange={(e) => onTermChange(e.target.value)}
                />
                <span className="faq-page__count numeric" aria-live="polite">{countLabel}</span>
              </div>
            </div>
            <div className="blog-board-chips faq-page__chips">
              {topics.map((topic) => (
                <a key={topic.id} href={`#${topic.id}`}>
                  {topic.name}
                  <small className="numeric">{topic.count}</small>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
