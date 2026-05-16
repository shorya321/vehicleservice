"use client"
import Link from 'next/link'
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import type { PopularRoute } from '@/components/search/popular-routes'
import { buildSearchUrl } from '@/lib/utils/url-builder'

interface DeparturePointsClientProps {
  routes: PopularRoute[]
  totalRoutes: number
  todayDate: string
}

export function DeparturePointsClient({ routes, totalRoutes, todayDate }: DeparturePointsClientProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="routes-heading"
      className="editorial-section editorial-section--raised editorial-section--spacious"
    >
      <div className="luxury-container">
        <motion.header
          className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="max-w-2xl">
            <div className="editorial-eyebrow">Routes</div>
            <h2 id="routes-heading" className="editorial-section-title mt-5">
              The routes travellers book most often.
            </h2>
            <p className="editorial-body mt-6">
              Quoted in your selected currency. Tap a route to see vehicles, capacity, and final pricing for your date.
            </p>
          </div>
          {totalRoutes > routes.length && (
            <Link href="/routes" className="editorial-action shrink-0">
              All routes
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </motion.header>

        <ul className="mt-12 border-t border-[var(--graphite)]">
          {routes.map((route, index) => {
            const href = route.originSlug && route.destinationSlug
              ? buildSearchUrl(route.originSlug, route.destinationSlug, { date: todayDate, passengers: 2 })
              : `/search/results?from=${route.originLocationId}&to=${route.destinationLocationId}&date=${todayDate}&passengers=2`

            return (
              <motion.li
                key={route.id}
                className="border-b border-[var(--graphite)]"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Link
                  href={href}
                  aria-label={`Search transfers from ${route.originName} to ${route.destinationName}`}
                  className="group grid grid-cols-1 items-baseline gap-y-2 py-6 transition-colors hover:bg-[rgba(var(--gold-rgb),0.06)] active:bg-[rgba(var(--gold-rgb),0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] md:grid-cols-[4rem_1fr_auto_auto_auto] md:gap-x-8 md:px-2"
                >
                  <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold-text)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[var(--text-primary)]">
                    <span className="font-display text-2xl leading-tight">{route.originName}</span>
                    <span className="text-[var(--text-muted)]" aria-hidden="true">→</span>
                    <span className="font-display text-2xl leading-tight">{route.destinationName}</span>
                  </span>
                  <span className="numeric text-sm text-[var(--text-secondary)]">
                    {route.distance} km
                  </span>
                  <span className="numeric text-sm text-[var(--text-secondary)]">
                    {route.duration} min
                  </span>
                  <span className="editorial-action text-[var(--gold-text)] group-hover:text-[var(--gold)]">
                    Search
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
