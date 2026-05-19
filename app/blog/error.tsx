'use client'

import Link from "next/link"

export default function BlogError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="bg-[var(--black-void)] min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h2 className="t-headline mb-4">
          Something went wrong
        </h2>
        <p className="t-body mb-8">
          We couldn&apos;t load the blog. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-2.5 text-[0.8125rem] font-semibold tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--onyx)] rounded-[4px] hover:bg-[var(--gold-deep)] transition-colors duration-300"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 text-[0.8125rem] font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
