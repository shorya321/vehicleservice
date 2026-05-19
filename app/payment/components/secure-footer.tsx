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
              className="t-label"
            >
              {badge.label}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
