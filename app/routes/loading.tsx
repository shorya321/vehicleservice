export default function RoutesLoading() {
  return (
    <section className="editorial-section editorial-section--raised editorial-section--spacious">
      <div className="luxury-container">
        <header className="max-w-2xl">
          <div className="h-4 w-16 rounded bg-[rgba(var(--gold-rgb),0.15)] animate-pulse" />
          <div className="mt-5 h-10 w-80 rounded bg-[var(--charcoal)]/30 animate-pulse" />
          <div className="mt-6 h-5 w-96 rounded bg-[var(--charcoal)]/20 animate-pulse" />
        </header>

        <div className="mt-12 border-t border-[var(--graphite)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-baseline gap-8 border-b border-[var(--graphite)] py-6 px-2"
            >
              <div className="h-4 w-8 rounded bg-[rgba(var(--gold-rgb),0.1)] animate-pulse" />
              <div className="flex-1 flex items-baseline gap-3">
                <div className="h-7 w-40 rounded bg-[var(--charcoal)]/25 animate-pulse" />
                <div className="h-4 w-4 rounded bg-[var(--charcoal)]/15 animate-pulse" />
                <div className="h-7 w-44 rounded bg-[var(--charcoal)]/25 animate-pulse" />
              </div>
              <div className="h-4 w-14 rounded bg-[var(--charcoal)]/20 animate-pulse" />
              <div className="h-4 w-14 rounded bg-[var(--charcoal)]/20 animate-pulse" />
              <div className="h-4 w-16 rounded bg-[rgba(var(--gold-rgb),0.1)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
