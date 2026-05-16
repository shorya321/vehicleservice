'use client'

const badges = [
  { label: 'SSL encrypted' },
  { label: 'PCI DSS compliant' },
  { label: 'Stripe-processed' },
  { label: '24/7 support' },
]

export function SecureFooter() {
  return (
    <footer className="border-t border-[var(--graphite)] bg-[var(--black-void)] py-6">
      <div className="luxury-container">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {badges.map((badge) => (
            <li
              key={badge.label}
              className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]"
            >
              {badge.label}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
