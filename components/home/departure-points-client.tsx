"use client"
import Link from 'next/link'
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { railHeight, type Corridor } from '@/lib/routes/corridors'
import { buildSearchUrl } from '@/lib/utils/url-builder'

interface DeparturePointsClientProps {
  corridors: Corridor[]
  todayDate: string
}

/**
 * The mark cell fills its row; the inner box is the place name's line box
 * (1.0625rem x 1.25 leading), so each mark centres on the FIRST line of its
 * name. A long name like "Atlantis - The Palm" can wrap in a three-up cell,
 * and anything measured off the whole name would drift when it does.
 */
const MARK_CELL = 'relative flex items-start'
const MARK_BOX = 'flex h-[1.328rem] items-center'

/** Half the line box: the offset from the top of a mark cell to the mark's centre. */
const HALF_LINE = '0.664rem'

const RULE = 'absolute left-1 w-px bg-[var(--graphite)]'

const NAME = 'text-[1.0625rem] font-medium leading-[1.25] tracking-[-0.012em] text-[var(--text-primary)]'

/**
 * Shared by every cell so the six tiles share one set of edges and inner padding.
 *
 * The shell itself is .route-stub in globals.css: the ground gradient, the
 * hairline, the inner top highlight, the ambient shadow and the hover cannot be
 * written as Tailwind arbitrary values (ease-[var(--ease-luxury)] and
 * bg-[var(--gold)]/40 both compile to nothing). The press feedback moved there
 * too, as a border change: the `active:` background tint that used to live here
 * is painted over by the ground gradient and would never have shown.
 *
 * ring-offset stays --black-rich: the offset ring is drawn outside the card, on
 * the section ground, not on the card's own.
 */
const CELL =
  'route-stub group focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[var(--black-rich)]'

/** The perforation separates the foot now, so no rule and no margins of its own. */
const FOOT = 'route-stub__foot flex items-center gap-3'

/** Two notches bitten out of the card's side edges. Decorative, never announced. */
const PERFORATION = (
  <span className="route-stub__perf" aria-hidden="true">
    <span className="route-stub__notch route-stub__notch--l" />
    <span className="route-stub__notch route-stub__notch--r" />
  </span>
)

/**
 * Colour lives in .route-stub__cta: neutral at rest, --gold-text on hover. The
 * card no longer spends the accent on anything that is just sitting there.
 */
const CTA =
  'route-stub__cta inline-flex items-center gap-1.5 whitespace-nowrap ' +
  'text-[0.6875rem] font-semibold uppercase tracking-[0.12em]'

export function DeparturePointsClient({ corridors, todayDate }: DeparturePointsClientProps) {
  const reduceMotion = useReducedMotion()

  // The rail is scaled to the corridors actually on screen, not to an absolute
  // km figure, so the shortest always reads short and the longest reads long.
  const distances = corridors.map((c) => c.distance)
  const minKm = Math.min(...distances)
  const maxKm = Math.max(...distances)

  return (
    <section
      aria-labelledby="routes-heading"
      className="editorial-section editorial-section--raised editorial-section--spacious"
    >
      <div className="luxury-container">
        {/*
          `whileInView` is ALWAYS supplied, with reduced motion collapsing only
          the duration and offset. The `whileInView={reduceMotion ? undefined :
          ...}` shape this file used to carry looks equivalent and is not:
          useReducedMotion() resolves false during SSR, so motion serialises
          opacity: 0 into the markup, then after hydration flips true,
          whileInView becomes undefined, and nothing animates the section back.
          Reduced-motion users got a permanently invisible section.
        */}
        <motion.header
          className="max-w-2xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="editorial-eyebrow">Routes</div>
          <h2 id="routes-heading" className="editorial-section-title mt-5">
            The routes travellers book most.
          </h2>
          <p className="editorial-body mt-6">
            Every corridor drawn to length. Open one to see vehicles, capacity, and the final number for your date.
          </p>
        </motion.header>

        {/* A real gap, not a 1px seam over a --graphite ground: the tiles carry
            their own edges now, so the grid has nothing left to draw. */}
        <ul className="mt-12 grid grid-cols-1 gap-5 min-[620px]:grid-cols-2 min-[950px]:grid-cols-3">
          {corridors.map((corridor, index) => {
            const href = corridor.originSlug && corridor.destinationSlug
              ? buildSearchUrl(corridor.originSlug, corridor.destinationSlug, { date: todayDate, passengers: 2 })
              : `/search/results?from=${corridor.originLocationId}&to=${corridor.destinationLocationId}&date=${todayDate}&passengers=2`

            const rail = railHeight(corridor.distance, minKm, maxKm)

            return (
              <motion.li
                key={corridor.id}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.45,
                  delay: reduceMotion ? 0 : index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Link
                  href={href}
                  aria-label={`Search transfers from ${corridor.originName} to ${corridor.destinationName}`}
                  className={CELL}
                >
                  {/*
                    Three rows, so the rail is a real grid track rather than a
                    margin measured off the text. Row 2's height IS the distance.
                  */}
                  {/*
                    content-start matters: without it the `auto` rows stretch to
                    fill the box and soak up the leftover height, so the gap
                    between the marks stops being the rail and the distance
                    encoding is damped. Pinning the rows keeps dot-to-ring at
                    exactly one line box + the rail. The slack is absorbed by
                    .route-stub__top instead, which is what holds the
                    perforation level across cards of differing rail length.
                  */}
                  <div className="route-stub__top">
                    <div
                      className="grid content-start grid-cols-[9px_minmax(0,1fr)] gap-x-4"
                      style={{ gridTemplateRows: `auto ${rail}px auto` }}
                    >
                      <span className={MARK_CELL} aria-hidden="true">
                        <span className={MARK_BOX}>
                          <span className="route-stub__dot" />
                        </span>
                        {/* Runs from the dot's centre to the bottom of this row,
                            so the rule meets the mark however the name wraps. */}
                        <span className={`${RULE} bottom-0`} style={{ top: HALF_LINE }} />
                      </span>
                      <span className={NAME}>{corridor.originName}</span>

                      <span className="relative block">
                        <span aria-hidden="true" className={`${RULE} bottom-0 top-0`} />
                        {/*
                          NOT aria-hidden. The rule and the marks are decorative,
                          but this is the distance itself, and the footer carries
                          only the duration — hiding it would leave a screen
                          reader with half the figures.
                          --text-secondary, not --text-muted: muted fails WCAG AA
                          at this size over the light ground (see cities.tsx).
                        */}
                        <span className="numeric absolute left-[14px] top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.6875rem] text-[var(--text-secondary)]">
                          {corridor.distance} km
                        </span>
                      </span>
                      <span aria-hidden="true" />

                      <span className={MARK_CELL} aria-hidden="true">
                        {/* Mirror of the origin rule: top of the row down to the
                            ring's centre, closing the run. */}
                        <span className={`${RULE} top-0`} style={{ height: HALF_LINE }} />
                        <span className={MARK_BOX}>
                          <span className="route-stub__ring" />
                        </span>
                      </span>
                      <span className={NAME}>{corridor.destinationName}</span>
                    </div>
                  </div>

                  {PERFORATION}

                  <div className={`${FOOT} justify-between`}>
                    <span className="numeric text-[0.8125rem] text-[var(--text-secondary)]">
                      {corridor.duration} min
                    </span>
                    <span className={CTA}>
                      Search
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </motion.li>
            )
          })}

          {/* Sixth cell. Five corridors leave a hole in a 3x2 grid, and this is
              also the section's only "all routes" affordance now that the
              header link is gone. */}
          <motion.li
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : corridors.length * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* No perforation and no ground of its own: this is a way out of
                the section, not a transfer. */}
            <Link href="/routes" className={`${CELL} route-stub--all`}>
              <div className="route-stub__top">
                <span className={`block ${NAME}`}>All routes</span>
                <span className="mt-2 block text-[0.875rem] leading-[1.55] text-[var(--text-secondary)]">
                  Every corridor we cover, with distance and drive time.
                </span>
              </div>
              <div className={`${FOOT} justify-end`}>
                <span className={CTA}>
                  Browse
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          </motion.li>
        </ul>
      </div>
    </section>
  )
}
