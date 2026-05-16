'use client'

import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'

interface Location {
  id: string
  name: string
  city: string | null
  country_code: string
  slug: string
}

interface SearchSummaryProps {
  origin: Location | null
  destination: Location | null
  date: Date
  passengers: number
}

interface Segment {
  label: string
  value: React.ReactNode
}

export function SearchSummary({ origin, destination, date, passengers }: SearchSummaryProps) {
  const reduceMotion = useReducedMotion()

  const segments: Segment[] = [
    {
      label: 'Route',
      value: (
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="editorial-section-title">{origin?.city || origin?.name || 'Unknown'}</span>
          <span className="text-[var(--gold)]" aria-hidden="true">→</span>
          <span className="editorial-section-title">{destination?.city || destination?.name || 'Unknown'}</span>
        </span>
      ),
    },
    {
      label: 'Date',
      value: <span className="numeric text-lg">{format(date, 'EEE · d MMM yyyy')}</span>,
    },
    {
      label: 'Passengers',
      value: (
        <span className="numeric text-lg">
          {passengers} <span className="ml-1 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">pax</span>
        </span>
      ),
    },
  ]

  return (
    <motion.header
      className="relative border-b border-[var(--graphite)] bg-[var(--black-rich)]"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="luxury-container py-10 lg:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          New search
        </Link>

        <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-[2fr_1fr_1fr] sm:items-baseline">
          {segments.map((seg) => (
            <div key={seg.label} className="border-t border-[var(--graphite)] pt-4">
              <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {seg.label}
              </div>
              <div className="mt-2 text-[var(--text-primary)]">
                {seg.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.header>
  )
}
