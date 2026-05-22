export function ContactHero() {
  return (
    <section className="pt-16 pb-10 md:pt-20 md:pb-12 bg-[var(--black-void)]">
      <div className="luxury-container max-w-3xl">
        <div className="w-10 h-px bg-[var(--gold)] mb-5" aria-hidden="true" />
        <p className="text-[0.75rem] font-medium tracking-[0.12em] uppercase text-[var(--gold-text)] mb-4">
          Get in Touch
        </p>

        <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] mb-4 [text-wrap:balance]">
          Contact
        </h1>

        <p className="text-[0.9375rem] leading-relaxed tracking-[0.01em] text-[var(--text-secondary)] max-w-xl [text-wrap:pretty]">
          Questions about a booking, corporate inquiries, or general feedback.
          Our concierge team responds within 24 hours.
        </p>
      </div>
    </section>
  )
}
