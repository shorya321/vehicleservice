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
        <div className="home-hero-grain pointer-events-none absolute inset-0" />
      </div>

      <div className="luxury-container relative z-10 pb-[clamp(4.5rem,9vw,7rem)] pt-[clamp(3rem,7vw,5.5rem)]">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center text-center">
          <p className="hero-reveal hero-reveal--eyebrow editorial-eyebrow hero-eyebrow">
            {/* One flex child. Loose text nodes become separate flex items and
                wrap into columns once the rules take their share of the row. */}
            <span>
              Airport &amp; city transfers,{' '}
              <span className="text-[var(--gold-text)]">fixed-price</span>
            </span>
          </p>

          <h1
            id="hero-headline"
            className="hero-reveal hero-reveal--headline hero-headline mt-7 text-[clamp(2.5rem,6.2vw,4.75rem)] font-medium leading-[1.04] tracking-[-0.032em] text-[var(--text-primary)]"
          >
            Booked before you land.
          </h1>

          <p className="hero-reveal hero-reveal--summary hero-summary mx-auto mt-[1.625rem] max-w-[46ch] text-[1.0625rem] leading-[1.62] text-[var(--text-secondary)]">
            Pick a route, choose a vehicle, confirm your transfer. Fixed pricing in your currency across 40+ cities.
          </p>

          <div className="hero-booking-reveal mt-[3.25rem] w-full">
            <SearchForm todayDate={todayDate} />
          </div>

          <p className="hero-reveal hero-reveal--trust hero-trust mt-5">
            <span>Fixed price at booking</span>
            <span>Flight tracked</span>
            <span>Free cancellation</span>
          </p>

          <dl className="hero-reveal hero-reveal--stats hero-stats mt-14">
            <div>
              <dt>40+</dt>
              <dd>Cities</dd>
            </div>
            <div>
              <dt>120+</dt>
              <dd>Vehicles</dd>
            </div>
            <div>
              <dt>
                4.9
                <span className="hero-stats-star" aria-hidden="true">&#9733;</span>
                <span className="sr-only"> star</span>
              </dt>
              <dd>Rating</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
