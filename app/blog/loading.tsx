function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden blog-card-surface">
      <div className="aspect-[16/10] bg-[var(--charcoal-light)] animate-pulse" />
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

function FeaturedSkeleton() {
  return (
    <div className="blog-featured-spread rounded-lg overflow-hidden">
      <div className="grid lg:grid-cols-[3fr_2fr]">
        <div className="aspect-[16/10] lg:aspect-auto lg:min-h-[400px] bg-[var(--charcoal-light)] animate-pulse" />
        <div className="p-8 lg:p-12 bg-[var(--charcoal)] space-y-4">
          <div className="h-3 w-20 rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-full rounded bg-[var(--charcoal-light)] animate-pulse" />
            <div className="h-7 w-3/4 rounded bg-[var(--charcoal-light)] animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-[var(--charcoal-light)] animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-[var(--charcoal-light)] animate-pulse" />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="h-3 w-28 rounded bg-[var(--charcoal-light)] animate-pulse" />
            <div className="h-3 w-16 rounded bg-[var(--charcoal-light)] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BlogLoading() {
  return (
    <div className="bg-[var(--black-void)]" role="status" aria-busy="true" aria-label="Loading blog content">
      {/* Hero skeleton */}
      <div className="blog-category-hero">
        <div className="luxury-container space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-[var(--charcoal-light)]" />
            <div className="h-3 w-12 rounded bg-[var(--charcoal-light)] animate-pulse" />
            <div className="w-6 h-px bg-[var(--charcoal-light)]" />
          </div>
          <div className="h-12 w-64 rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="space-y-2 max-w-[600px]">
            <div className="h-4 w-full rounded bg-[var(--charcoal-light)] animate-pulse" />
            <div className="h-4 w-72 rounded bg-[var(--charcoal-light)] animate-pulse" />
          </div>
          <div className="h-8 w-24 rounded-full bg-[var(--charcoal-light)] animate-pulse" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <section className="bg-[var(--black-rich)] border-t border-[var(--graphite)] py-6">
        <div className="luxury-container">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-20 rounded-full bg-[var(--charcoal-light)] animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured spread skeleton */}
      <section className="bg-[var(--black-void)] pt-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          <FeaturedSkeleton />
        </div>
      </section>

      {/* Grid skeleton */}
      <section className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
