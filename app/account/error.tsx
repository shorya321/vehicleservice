'use client'

import { useEffect } from 'react'

/**
 * This rendered on pure shadcn tokens (text-destructive, muted-foreground, a
 * Button variant), so the one screen a customer sees when something breaks was
 * the one screen that did not look like the product. Now on the page's own
 * vocabulary: eyebrow, heading, .btn.
 *
 * The copy says what happened and what to do about it, and does not apologise.
 */
export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[360px] flex-col items-start justify-center py-16">
      <p className="account-eyebrow">Account</p>
      <h2 className="mt-[0.4rem] text-[clamp(1.5rem,3vw,2rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)]">
        This page did not load
      </h2>
      <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
        Your bookings and details are safe. This was a problem fetching them, not a
        problem with your account. Try again, and if it keeps happening, reply to any
        booking email and someone will pick it up.
      </p>
      <button onClick={() => reset()} className="btn btn-secondary mt-6">
        Try again
      </button>
      {error.digest && (
        <p className="mt-4 text-[0.75rem] text-[var(--text-muted)]">
          Reference <span className="numeric">{error.digest}</span>
        </p>
      )}
    </div>
  )
}
