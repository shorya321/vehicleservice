'use client'

export function GuaranteeCard() {
  return (
    <div className="border-t border-[var(--graphite)] pt-4">
      <div className="t-label">
        Cancellation
      </div>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
        <span className="text-[var(--success)] font-medium">Free cancellation</span> up to 24 hours before pickup. Full refund if we cancel your transfer.
      </p>
    </div>
  )
}
