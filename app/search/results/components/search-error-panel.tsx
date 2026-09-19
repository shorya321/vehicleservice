'use client'

import { useEffect } from 'react'

/**
 * Shared by both search routes' error boundaries. Left-aligned in a band like
 * every other section on the page, rather than the centred shadcn default the
 * query-param route used to render with `text-destructive` and `bg-muted`.
 */
export function SearchErrorPanel({
  error,
  reset,
  context,
}: {
  error: Error & { digest?: string }
  reset: () => void
  context: string
}) {
  useEffect(() => {
    console.error(`${context} error:`, error)
  }, [context, error])

  return (
    <section className="editorial-section editorial-section--raised editorial-section--spacious grow">
      <div className="luxury-container">
        <div className="max-w-2xl">
          <div className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />Search failed</div>
          <h2 className="editorial-section-title mt-5">Couldn&rsquo;t load results.</h2>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
            A network or system issue interrupted the search. Try again, or start a new one from the
            home page.
          </p>
          <button onClick={reset} className="btn btn-primary mt-8 inline-flex">
            Try again
          </button>
        </div>
      </div>
    </section>
  )
}
