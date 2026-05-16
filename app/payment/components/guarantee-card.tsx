'use client'

export function GuaranteeCard() {
  return (
    <div className="border-t border-[var(--graphite)] pt-4">
      <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Cancellation
      </div>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
        Free cancellation up to 24 hours before pickup. Full refund if we don&rsquo;t deliver.
      </p>
    </div>
  )
}
