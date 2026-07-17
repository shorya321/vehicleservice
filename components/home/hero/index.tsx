import { SearchForm } from './search-form'

export function Hero({ todayDate }: { todayDate: string }) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="home-hero-color home-hero-motion relative bg-[var(--black-void)] pt-[clamp(5rem,12vw,6.5rem)]"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="home-hero-color-wash pointer-events-none absolute inset-0" />
      </div>

      <div className="luxury-container relative z-10 pb-[clamp(4rem,8vw,6.5rem)] pt-[clamp(3rem,7vw,5.5rem)]">
        <div className="mx-auto max-w-[52rem] text-center">
          <div className="hero-reveal hero-reveal--eyebrow">
            <p className="mx-auto text-[0.6875rem] font-medium tracking-[0.2em] uppercase text-[var(--gold-text)]">
              Airport & city transfers, fixed-price
            </p>
          </div>

          <h1
            id="hero-headline"
            className="hero-reveal hero-reveal--headline mt-5 font-display text-[clamp(2.75rem,6.5vw,5.25rem)] font-medium leading-[1.12] tracking-[-0.015em] text-[var(--text-primary)]"
          >
            Infinia Transfers
            <br />
            Booked Before You Land
          </h1>

          <p
            className="hero-reveal hero-reveal--summary mx-auto mt-7 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]"
          >
            Pick a route, choose a vehicle, confirm your transfer. Fixed pricing in your currency across 40+ cities.
          </p>

          <div
            className="hero-reveal hero-reveal--stats hero-itinerary-stats mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.8125rem] tracking-wide text-[var(--text-muted)]"
          >
            <span><span className="tabular-nums font-bold text-[var(--gold-text)]">40+</span> cities</span>
            <span className="hero-itinerary-separator" aria-hidden="true">|</span>
            <span><span className="tabular-nums font-bold text-[var(--gold-text)]">120+</span> vehicles</span>
            <span className="hero-itinerary-separator" aria-hidden="true">|</span>
            <span><span className="tabular-nums font-bold text-[var(--gold-text)]">4.9</span><span aria-hidden="true">&#9733;</span><span className="sr-only"> star</span> rating</span>
          </div>
        </div>

        <div
          className="hero-itinerary-rule mx-auto mt-12 max-w-lg"
          aria-hidden="true"
        />

        <div className="hero-booking-reveal mx-auto mt-10 max-w-4xl">
          <SearchForm todayDate={todayDate} />
        </div>
      </div>
    </section>
  )
}
