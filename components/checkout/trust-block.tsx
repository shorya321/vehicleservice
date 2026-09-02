'use client'

/**
 * The reassurance block beneath the order summary.
 *
 * Every claim here is contractual, not marketing. Sources:
 *  - Free cancellation up to 24h  -> app/terms/components/terms-content.tsx (Cancellation)
 *  - 60 / 45 minutes free waiting -> app/terms/components/terms-content.tsx (Waiting Time)
 *  - What the fixed fare includes -> app/terms/components/terms-content.tsx (Pricing)
 *  - Name board in arrivals       -> app/terms/components/terms-content.tsx (Service Delivery)
 *
 * Do not add a claim here that is not in the Terms.
 */
const GUARANTEES = [
  {
    label: 'Cancellation',
    body: 'Free up to 24 hours before pickup. Full refund if we cancel on you.',
  },
  {
    label: 'Waiting time',
    body: '60 minutes free from your actual landing time, 45 minutes on other pickups.',
  },
  {
    label: 'Your chauffeur',
    body: 'Meets you inside arrivals with a name board and walks you to the vehicle.',
  },
] as const

export function TrustBlock() {
  return (
    // These are the three strongest commercial promises the business makes, and they were
    // typeset as fine print glued to the bottom of the summary card. Naming the block reframes
    // three legal clauses as three services, at no cost to the claim itself.
    <div className="mt-8">
      <h2 className="checkout-section-title">Included with every transfer</h2>
      <dl className="mt-5 flex flex-col">
        {GUARANTEES.map((item) => (
          <div
            key={item.label}
            className="pb-4 mb-4 border-b border-[var(--graphite)] last:mb-0"
          >
            {/* Tier 2, matching .checkout-field-label / .checkout-route-label exactly. */}
            <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {item.label}
            </dt>
            <dd className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

TrustBlock.displayName = 'TrustBlock'
