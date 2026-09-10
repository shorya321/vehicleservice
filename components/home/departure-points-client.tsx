"use client"
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { type Corridor } from '@/lib/routes/corridors'
import { SCRIM_TOKENS } from '@/lib/home/photo-scrim'
import { buildSearchUrl } from '@/lib/utils/url-builder'

interface DeparturePointsClientProps {
  corridors: Corridor[]
  /** Distinct corridors that exist, before the rail's own slice. */
  totalCorridors: number
  todayDate: string
}

const NAME = 'text-[1.0625rem] font-medium leading-[1.25] tracking-[-0.012em] text-[var(--text-primary)]'

const CELL =
  'route-stub corridor-card group focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[var(--black-rich)]'

const FOOT = 'route-stub__foot flex items-center gap-3'

const PERFORATION = (
  <span className="route-stub__perf" aria-hidden="true">
    <span className="route-stub__notch route-stub__notch--l" />
    <span className="route-stub__notch route-stub__notch--r" />
  </span>
)

const CTA =
  'route-stub__cta inline-flex items-center gap-1.5 whitespace-nowrap ' +
  'text-[0.6875rem] font-semibold uppercase tracking-[0.12em]'

/** Two-digit sequence, so 01 sits under 10 without the column shifting. */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function DeparturePointsClient({
  corridors,
  totalCorridors,
  todayDate,
}: DeparturePointsClientProps) {
  const reduceMotion = useReducedMotion()

  /**
   * The reveal is driven by the rail, not by each card.
   *
   * Per-card `whileInView` is what a grid wants, and it is wrong here: a card
   * scrolled past the right edge of the rail is outside the viewport rect, so
   * its observer never fires and it sits at opacity 0 until the reader happens
   * to scroll the rail sideways. Variants propagate from the parent instead, so
   * one trigger reveals every card and staggerChildren keeps the cascade.
   */
  const railReveal = {
    hidden: {},
    shown: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  }

  const slotReveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  const railRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  /**
   * The arrows replace the scrollbar, so they have to know the real edges.
   *
   * A ResizeObserver rather than a measurement in the effect body: it fires
   * once the moment it observes, which covers the first paint, and again on
   * every width change, which covers the breakpoint where the rail goes from
   * four columns to two and may stop overflowing altogether. Measuring
   * synchronously here instead would be a setState in an effect body, which
   * this repo's lint forbids.
   */
  useEffect(() => {
    const el = railRef.current
    if (!el) return

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth
      setAtStart(el.scrollLeft <= 1)
      setAtEnd(max <= 1 || el.scrollLeft >= max - 1)
    }

    el.addEventListener('scroll', sync, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [])

  /**
   * One viewport of cards per press. The slots tile the rail's content box
   * exactly, so a clientWidth scroll always lands on a card edge and the snap
   * has nothing to correct.
   */
  const page = (direction: 1 | -1) => {
    const el = railRef.current
    if (!el) return

    el.scrollBy({
      left: direction * el.clientWidth,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section
      aria-labelledby="routes-heading"
      className={`editorial-section editorial-section--raised editorial-section--spacious ${SCRIM_TOKENS}`}
    >
      <div className="luxury-container">
        <motion.div
          className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <header className="max-w-2xl">
            <div className="editorial-eyebrow">Routes</div>
            <h2 id="routes-heading" className="editorial-section-title mt-5">
              The routes travellers book most.
            </h2>
            <p className="editorial-body mt-6">
              Short hops and long runs, each with the distance and the drive time we schedule
              against. Open one to see vehicles, capacity, and the final number for your date.
            </p>
          </header>

          {/* Both disabled means the rail is not scrollable at this width, which
              is the honest state: a live arrow that does nothing is worse than a
              dimmed one. */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rail-nav"
              onClick={() => page(-1)}
              disabled={atStart}
              aria-label="Previous routes"
              aria-controls="routes-rail"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="rail-nav"
              onClick={() => page(1)}
              disabled={atEnd}
              aria-label="Next routes"
              aria-controls="routes-rail"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        {/*
          Inside .luxury-container, not full bleed. The container's own gutter
          is then the rail's clip boundary on BOTH sides, so the spacing is
          symmetric and the fifth card begins exactly at the right gutter rather
          than running under it. A half card showing at rest reads as a layout
          that overflowed; the arrows are what reveal the next page.

          tabindex and role are not decoration. A scrollable region that contains
          focusable children is still unreachable by keyboard scroll unless the
          container itself can take focus, and everything past the fold would be
          reachable only by tabbing blindly through it.
        */}
        <motion.ul
        ref={railRef}
        id="routes-rail"
        className="route-rail mt-12"
        tabIndex={0}
        role="group"
        aria-label="Popular routes, scroll horizontally"
        variants={railReveal}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.2 }}
      >
        {corridors.map((corridor, index) => {
          const href = corridor.originSlug && corridor.destinationSlug
            ? buildSearchUrl(corridor.originSlug, corridor.destinationSlug, { date: todayDate, passengers: 2 })
            : `/search/results?from=${corridor.originLocationId}&to=${corridor.destinationLocationId}&date=${todayDate}&passengers=2`

          return (
            <motion.li key={corridor.id} className="corridor-slot" variants={slotReveal}>
              <Link
                href={href}
                aria-label={`Search transfers from ${corridor.originName} to ${corridor.destinationName}`}
                className={CELL}
              >
                {/*
                  The plate carries the photo when there is one and a gold-raked
                  gradient when there is not, so a route an admin has not got to
                  yet still reads as a card rather than as a gap.
                */}
                <div className="corridor-card__plate">
                  {corridor.image ? (
                    <>
                      <Image
                        src={corridor.image}
                        alt={corridor.imageAlt || `${corridor.originName} to ${corridor.destinationName}`}
                        fill
                        sizes="(min-width: 900px) 340px, 78vw"
                        className="z-0 object-cover [filter:var(--media-filter)]"
                      />
                      {/*
                        A short fade at the foot of the plate, NOT the Cities
                        band's full scrim. That scrim is sized to carry caption
                        text over the photograph; here the caption sits below the
                        plate and the only thing on the image is the numeral
                        chip, which brings its own ground. Applied here the same
                        scrim only washes the photography out.
                      */}
                      <span className="corridor-card__plate-veil" aria-hidden="true" />
                    </>
                  ) : (
                    <span className="corridor-card__plate-fallback" aria-hidden="true" />
                  )}
                  <span className="corridor-card__seq numeric">{ordinal(index)}</span>
                </div>

                <div className="route-stub__top flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.75rem] leading-[1.3] tracking-[0.04em] text-[var(--text-secondary)]">
                      {corridor.originName}
                    </span>
                    <span className={NAME}>{corridor.destinationName}</span>
                  </div>

                  {/*
                    The figures are the section's quantitative device now. They
                    replace the proportional distance rail this card used to
                    draw: stating 22 km as a number and again as a bar length is
                    one fact told twice, and the plate has taken the vertical
                    room the bar needed.
                  */}
                  <div className="corridor-card__figs mt-auto">
                    <span className="numeric corridor-card__fig">{corridor.distance}</span>
                    <span className="corridor-card__unit">km</span>
                    <span className="corridor-card__sep" aria-hidden="true" />
                    <span className="numeric corridor-card__fig">{corridor.duration}</span>
                    <span className="corridor-card__unit">min</span>
                  </div>
                </div>

                {PERFORATION}

                <div className={`${FOOT} justify-end`}>
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

        <motion.li className="corridor-slot" variants={slotReveal}>
          <Link href="/routes" className={`${CELL} route-stub--all`}>
            <div className="route-stub__top flex flex-col justify-end">
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
        </motion.ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <span className="numeric text-[0.75rem] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            {corridors.length} of {totalCorridors}{' '}
            {totalCorridors === 1 ? 'corridor' : 'corridors'}
          </span>
          <Link href="/routes" className={CTA}>
            Open the route index
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
