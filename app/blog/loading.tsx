function CardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="rounded-lg overflow-hidden blog-card-surface">
      <div className={`${large ? 'aspect-[4/3]' : 'aspect-[16/10]'} bg-[var(--charcoal-light)] animate-pulse`} />
      <div className="p-5 space-y-3">
        <div className="flex gap-4">
          <div className="h-3 w-24 rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="h-3 w-16 rounded bg-[var(--charcoal-light)] animate-pulse" />
        </div>
        <div className="h-5 w-3/4 rounded bg-[var(--charcoal-light)] animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-[var(--charcoal-light)] animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function BlogLoading() {
  return (
    <div className="bg-[var(--black-void)]">
      {/* Hero skeleton — warm-tinted text hero */}
      <div className="blog-category-hero">
        <div className="luxury-container space-y-4">
          <div className="h-12 w-64 rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="space-y-2 max-w-[600px]">
            <div className="h-4 w-full rounded bg-[var(--charcoal-light)] animate-pulse" />
            <div className="h-4 w-72 rounded bg-[var(--charcoal-light)] animate-pulse" />
          </div>
          <div className="h-8 w-24 rounded-full bg-[var(--charcoal-light)] animate-pulse" />
        </div>
      </div>

      {/* Tabs skeleton — bg-rich */}
      <section className="bg-[var(--black-rich)] border-t border-[var(--graphite)] py-6">
        <div className="luxury-container">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-20 rounded-full bg-[var(--charcoal-light)] animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* Posts skeleton — bg-void */}
      <section className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          <div className="blog-magazine-grid">
            <CardSkeleton large />
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
