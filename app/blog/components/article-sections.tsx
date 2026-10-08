import DOMPurify from 'isomorphic-dompurify'
import { wrapTables, type AnchoredSection } from '@/lib/blog/sections'

interface ArticleSectionsProps {
  sections: AnchoredSection[]
}

/** The article text, one anchored block per heading so the contents list can jump to it. */
export function ArticleSections({ sections }: ArticleSectionsProps) {
  if (sections.length === 0) {
    return (
      <div className="prose-luxury">
        <p className="text-[var(--text-muted)]">This article is being prepared.</p>
      </div>
    )
  }

  return (
    <div className="prose-luxury article-sections">
      {sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="article-section">
          <h2 id={`${section.id}-h`}>{section.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: wrapTables(DOMPurify.sanitize(section.body)) }} />
        </section>
      ))}
    </div>
  )
}
