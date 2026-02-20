'use client'

import { useEffect } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function VendorApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Vendor application page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--black-void)]">
      <div className="luxury-container py-8 md:py-12">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </Link>

        <div className="max-w-xl mx-auto text-center space-y-6">
          <h1 className="text-2xl font-medium text-[var(--text-primary)]">
            Something went wrong
          </h1>
          <p className="text-[var(--text-muted)]">
            We couldn&apos;t load your vendor application. Please try again.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link href="/account" className="btn btn-secondary">
              Go to Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
