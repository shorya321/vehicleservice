'use client'

import { useEffect } from 'react'

export default function RoutesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Routes page error:', error)
  }, [error])

  return (
    <section className="editorial-section editorial-section--raised editorial-section--spacious">
      <div className="luxury-container">
        <div className="py-24 text-center">
          <h2 className="editorial-section-title">Something went wrong</h2>
          <p className="editorial-body mt-4 text-[var(--text-muted)]">
            We couldn&apos;t load the routes. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-medium text-[var(--onyx)] transition-colors hover:bg-[var(--gold-medium)]"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  )
}
