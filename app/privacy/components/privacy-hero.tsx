interface PrivacyHeroProps {
  lastUpdated: string
}

export function PrivacyHero({ lastUpdated }: PrivacyHeroProps) {
  return (
    <section className="pt-16 pb-10 md:pt-20 md:pb-12 bg-[var(--black-void)]">
      <div className="luxury-container">
        <div className="w-10 h-px bg-[var(--gold)] mb-5" aria-hidden="true" />
        <p className="text-[0.75rem] font-medium tracking-[0.16em] uppercase text-[var(--gold-text)] mb-4">
          Legal
        </p>

        <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] mb-4 [text-wrap:balance]">
          Privacy Policy
        </h1>

        <p className="text-[0.9375rem] leading-relaxed tracking-[0.01em] text-[var(--text-secondary)] max-w-xl [text-wrap:pretty]">
          How we collect, use, and safeguard your personal information when you book with us.
        </p>

        <p className="mt-6 text-[0.8125rem] tracking-[0.01em] text-[var(--text-muted)]">
          Last updated: {lastUpdated}
        </p>
      </div>
    </section>
  )
}
