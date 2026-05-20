'use client'

import { motion, useReducedMotion } from 'motion/react'
import { MapPin, ArrowRight, Calendar, Users } from 'lucide-react'
import { CheckoutAuthForm } from './checkout-auth-form'
import { CheckoutHeroPanel } from './checkout-hero-panel'
import { ProgressBar } from '@/components/checkout/progress-bar'

interface CheckoutLoginContentProps {
  returnUrl: string
}

function MobileBookingSummary({ returnUrl }: { returnUrl: string }) {
  let decoded: string
  try {
    decoded = decodeURIComponent(returnUrl)
  } catch {
    return null
  }
  const params = new URLSearchParams(decoded.split('?')[1] || '')

  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const from = rawFrom && rawFrom.length <= 100 ? rawFrom : null
  const to = rawTo && rawTo.length <= 100 ? rawTo : null
  const date = params.get('date')
  const passengers = params.get('passengers')

  if (!from && !to) return null

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="lg:hidden mb-6 rounded-[8px] border border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] p-4">
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--gold)] mb-3">
        Your Booking
      </div>
      {(from || to) && (
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-4 h-4 text-[var(--gold)] flex-shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] min-w-0">
            {from && <span className="truncate">{from}</span>}
            {from && to && <ArrowRight className="w-3 h-3 text-[var(--gold)] flex-shrink-0" aria-hidden="true" />}
            {to && <span className="truncate">{to}</span>}
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        {formattedDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" aria-hidden="true" />
            <span>{formattedDate}</span>
          </div>
        )}
        {passengers && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--gold)]" aria-hidden="true" />
            <span>{passengers} passenger{parseInt(passengers) !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function CheckoutLoginContent({ returnUrl }: CheckoutLoginContentProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      <div className="auth-page bg-[var(--black-void)]" style={{ minHeight: 'calc(100dvh - 5rem)' }}>
        <CheckoutHeroPanel />

        <section className="auth-panel" style={{ minHeight: 'calc(100dvh - 5rem)' }}>
          {/* Progress Bar sits at the top of the right panel */}
          <div className="w-full max-w-[480px] mb-6">
            <ProgressBar currentStep={2} />
          </div>

          <div className="auth-container">
            {/* Page Header */}
            <motion.header
              className="text-center mb-6 md:mb-8"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="editorial-eyebrow mb-4 justify-center">Secure checkout</span>
              <h1 className="editorial-headline mt-4">
                Continue your <em>booking.</em>
              </h1>
              <p className="mt-4 text-[var(--text-muted)] text-[0.9375rem] leading-relaxed max-w-md mx-auto">
                Sign in or create an account to confirm your transfer
              </p>
            </motion.header>

            {/* Mobile Booking Summary */}
            <MobileBookingSummary returnUrl={returnUrl} />

            {/* Auth Form */}
            <CheckoutAuthForm returnUrl={returnUrl} />

            {/* Help link */}
            <motion.p
              className="mt-6 text-center text-sm text-[var(--text-muted)]"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? false : { opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Having trouble?{' '}
              <a
                href="/contact"
                className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] font-medium transition-colors"
              >
                Contact Support
              </a>
            </motion.p>
          </div>
        </section>
      </div>
    </>
  )
}
