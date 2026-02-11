'use client'

import Link from "next/link"

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="bg-[var(--black-void)] min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h2 className="text-2xl font-serif text-[var(--text-primary)] mb-4">
          Something went wrong
        </h2>
        <p className="text-[var(--text-muted)] mb-8">
          We couldn&apos;t load the blog. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-2 text-sm font-medium bg-[var(--gold)] text-[var(--black-void)] rounded-full hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
