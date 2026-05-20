import Link from 'next/link'

interface TagCloudProps {
  tags: { id: string; name: string; slug: string; count: number }[]
  currentSlug: string
}

export function TagCloud({ tags, currentSlug }: TagCloudProps) {
  return (
    <section
      className="editorial-section editorial-section--ground bg-[var(--black-void)]"
      aria-label="Related topics"
    >
      <div className="luxury-container">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-6 h-px bg-[var(--gold)]" />
          <h2 className="t-label-accent">Related Topics</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags
            .filter((t) => t.slug !== currentSlug)
            .map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="px-5 py-2.5 min-h-[44px] flex items-center text-sm rounded-lg border text-[var(--text-secondary)] border-[var(--graphite)] hover:border-[var(--gold)] hover:text-[var(--gold-text)] transition-all duration-300"
              >
                {tag.name}
                <span className="ml-1.5 text-[var(--text-muted)]">
                  ({tag.count})
                </span>
              </Link>
            ))}
        </div>
      </div>
    </section>
  )
}
