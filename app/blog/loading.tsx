function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--gold)]/10 bg-[var(--charcoal)]">
      <div className="aspect-[16/10] bg-[var(--charcoal-light)] animate-pulse" />
      <div className="p-6 space-y-3">
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
      {/* Hero skeleton */}
      <section className="relative py-14 md:py-20 bg-[var(--black-void)]">
        <div className="luxury-container text-center">
          <div className="h-3 w-20 mx-auto mb-6 rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="h-12 w-64 mx-auto mb-4 rounded bg-[var(--charcoal-light)] animate-pulse" />
          <div className="h-5 w-96 max-w-full mx-auto rounded bg-[var(--charcoal-light)] animate-pulse" />
        </div>
      </section>

      <div className="luxury-container py-10 md:py-16">
        {/* Category tabs skeleton */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-20 rounded-full bg-[var(--charcoal-light)] animate-pulse shrink-0" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
