"use client"

import Link from 'next/link'
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import type { PublicRouteItem } from '@/app/routes/actions'
import { buildSearchUrl } from '@/lib/utils/url-builder'

interface RoutesListClientProps {
  routes: PublicRouteItem[]
  todayDate: string
  startIndex: number
}

export function RoutesListClient({ routes, todayDate, startIndex }: RoutesListClientProps) {
  const reduceMotion = useReducedMotion()

  if (routes.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="editorial-body text-[var(--text-muted)]">
          No transfer routes available at the moment.
        </p>
      </div>
    )
  }

  return (
    <ul className="border-t border-[var(--graphite)]">
      {routes.map((route, index) => {
        const rank = startIndex + index + 1
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
              className="group grid grid-cols-1 items-baseline gap-y-2 py-6 transition-colors hover:bg-[rgba(var(--gold-rgb),0.06)] active:bg-[rgba(var(--gold-rgb),0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] md:grid-cols-[4rem_auto_1fr_auto_auto_auto] md:gap-x-8 md:px-2"
            >
              <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold-text)]">
                {String(rank).padStart(2, '0')}
              </span>

              {route.isPopular && (
                <span className="inline-flex items-center rounded-full bg-[rgba(var(--gold-rgb),0.12)] px-2.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-[var(--gold-text)]">
                  Popular
                </span>
              )}
              {!route.isPopular && (
                <span className="hidden md:block" />
              )}

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
  )
}
