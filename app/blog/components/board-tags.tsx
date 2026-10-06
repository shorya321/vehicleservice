import Link from "next/link"

interface BoardTagsProps {
  tags: { id: string; name: string; slug: string; count: number }[]
  /** Tag to leave out, e.g. the one whose page this is. */
  excludeSlug?: string
}

/** "Keep exploring": related tags as pills inside one double-bezel panel. */
export function BoardTags({ tags, excludeSlug }: BoardTagsProps) {
  const shown = excludeSlug ? tags.filter(t => t.slug !== excludeSlug) : tags
  if (shown.length === 0) return null

  return (
    <section aria-labelledby="blog-tags-heading" className="luxury-container blog-board-tags-sec">
      <div className="blog-board-bezel">
        <div className="blog-board-core blog-board-tags">
          <div>
            <p className="blog-board-eyebrow">
              <i aria-hidden="true" />
              Related tags
            </p>
            <h2 id="blog-tags-heading" className="blog-board-tags__title">Keep exploring.</h2>
          </div>
          <div className="blog-board-chips">
            {shown.map(tag => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                <span className="text-[var(--gold-text)]" aria-hidden="true">#</span>
                {tag.name}
                <small className="numeric">{tag.count}</small>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
