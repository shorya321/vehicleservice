import { HeroMap } from './hero-map'
import { SearchForm } from './search-form'
import type { TripSettings } from '@/lib/trips/settings'
import type { HeroContent } from '@/lib/cms/templates/home/schema'

interface HeroProps {
  todayDate: string
  /** Trip types the admin has switched on (Settings > General). */
  tripSettings?: TripSettings
  content: HeroContent
  /**
   * False while there are no approved reviews. A rating stat then reads as a
   * claim the testimonials further down contradict, so it is left out.
   */
  hasReviews: boolean
}

export function Hero({ todayDate, tripSettings, content, hasReviews }: HeroProps) {
  const stats = content.stats.filter((stat) => hasReviews || !stat.is_rating)

  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="home-hero-color home-hero-motion relative bg-[var(--black-void)] pt-[clamp(5rem,12vw,6.5rem)]"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <HeroMap />
      </div>

      <div className="luxury-container relative z-10 pb-[clamp(4.5rem,9vw,7rem)] pt-[clamp(3rem,7vw,5.5rem)]">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center text-center">
          <p className="hero-reveal hero-reveal--eyebrow editorial-eyebrow hero-eyebrow">
            {/* One flex child. Loose text nodes become separate flex items and
                wrap into columns once the rules take their share of the row. */}
            <span>
              {content.eyebrow}
              {content.eyebrow_accent && (
                <>
                  {' '}
                  <span className="text-[var(--gold-text)]">{content.eyebrow_accent}</span>
                </>
              )}
            </span>
          </p>

          <h1
            id="hero-headline"
            className="hero-reveal hero-reveal--headline hero-headline mt-[1.625rem] text-[clamp(2.5rem,6.2vw,4.75rem)] font-medium leading-[1.04] tracking-[-0.032em] text-[var(--text-primary)]"
          >
            {content.title}
          </h1>

          <p className="hero-reveal hero-reveal--summary hero-summary mx-auto mt-[1.625rem] max-w-[46ch] text-[1.0625rem] leading-[1.62] text-[var(--text-secondary)]">
            {content.summary}
          </p>

          <div className="hero-booking-reveal mt-12 w-full">
            <SearchForm todayDate={todayDate} tripSettings={tripSettings} />
          </div>

          <p className="hero-reveal hero-reveal--trust hero-trust mt-5">
            {content.trust.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </p>

          {stats.length > 0 && (
            <dl className="hero-reveal hero-reveal--stats hero-stats mt-12">
              {stats.map((stat, index) => (
                <div key={index}>
                  <dt>{stat.label}</dt>
                  <dd>
                    {stat.value}
                    {stat.is_rating && (
                      <>
                        <span className="hero-stats-star" aria-hidden="true">&#9733;</span>
                        <span className="sr-only"> star</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}
