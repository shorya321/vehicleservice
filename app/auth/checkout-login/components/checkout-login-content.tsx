'use client'

import Link from 'next/link'
import { MapPin, ArrowRight, Calendar, Users } from 'lucide-react'
import { CheckoutAuthForm } from './checkout-auth-form'
import { CheckoutHeroPanel } from './checkout-hero-panel'
import { AuthLogo } from '@/components/auth/auth-logo'

interface CheckoutLoginContentProps {
  returnUrl: string
}

function parseBookingParams(returnUrl: string) {
  let decoded: string
  try {
    decoded = decodeURIComponent(returnUrl)
  } catch {
    return { from: null, to: null, date: null, passengers: null }
  }
  const params = new URLSearchParams(decoded.split('?')[1] || '')

  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const from = rawFrom && rawFrom.length <= 100 ? rawFrom : null
  const to = rawTo && rawTo.length <= 100 ? rawTo : null
  const date = params.get('date')
  const passengers = params.get('passengers')

  return { from, to, date, passengers }
}

function MobileBookingSummary({ from, to, date, passengers }: {
  from: string | null
  to: string | null
  date: string | null
  passengers: string | null
}) {
  if (!from && !to) return null

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="lg:hidden mb-8 rounded-[8px] border border-[var(--graphite)] bg-[var(--charcoal)] p-4">
      <div className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[var(--gold-text)] mb-3">
        Your booking
      </div>
      {(from || to) && (
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-4 h-4 text-[var(--gold-text)] shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-2 auth-alert-text text-[var(--text-primary)] min-w-0">
            {from && <span className="truncate">{from}</span>}
            {from && to && <ArrowRight className="w-3 h-3 text-[var(--gold-text)] shrink-0" aria-hidden="true" />}
            {to && <span className="truncate">{to}</span>}
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 auth-hint text-[var(--text-secondary)]">
        {formattedDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
            <span>{formattedDate}</span>
          </div>
        )}
        {passengers && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
            <span>{passengers} passenger{parseInt(passengers) !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function CheckoutLoginContent({ returnUrl }: CheckoutLoginContentProps) {
  const { from, to, date, passengers } = parseBookingParams(returnUrl)

  return (
    <main className="auth-page">
      <CheckoutHeroPanel from={from} to={to} date={date} passengers={passengers} />

      <section className="auth-panel">
        <div className="auth-container">
          <div className="lg:hidden text-center mb-8">
            <AuthLogo className="text-2xl" />
          </div>

          <div>
            <div className="editorial-eyebrow">Secure checkout</div>
            <h1 className="editorial-headline mt-6">
              Continue your <em>booking.</em>
            </h1>
            <p className="editorial-body mt-6 max-w-md">
              Sign in or create an account to confirm your transfer.
            </p>
          </div>

          <MobileBookingSummary from={from} to={to} date={date} passengers={passengers} />

          <div className="mt-10">
            <CheckoutAuthForm returnUrl={returnUrl} />
          </div>

          <p className="mt-6 text-center auth-body-sm text-[var(--text-muted)]">
            Need help?{' '}
            <Link
              href="/contact"
              className="auth-text-link"
            >
              Contact support
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
