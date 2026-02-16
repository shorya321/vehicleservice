export function ContactHero() {
  return (
    <section className="relative py-14 md:py-20 bg-[var(--black-void)] overflow-hidden">
      {/* Background dot pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--gold) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Radial gold gradient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[var(--gold)]/5 blur-[100px] rounded-full" />

      <div className="relative z-10 luxury-container text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-[var(--gold)]" />
          <span className="text-xs font-medium tracking-[0.25em] uppercase text-[var(--gold)]">
            Get in Touch
          </span>
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-[var(--gold)]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[var(--text-primary)] mb-4">
          Contact <em className="text-[var(--gold)] not-italic">Infinia</em>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Have a question or need assistance with your luxury transfer? Our
          concierge team is here to help, around the clock.
        </p>

        {/* Decorative line */}
        <div className="mt-8 flex justify-center">
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        </div>
      </div>
    </section>
  )
}
