import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'
import { SecureFooter } from './secure-footer'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { CheckoutHeading } from '@/components/checkout/checkout-heading'
import { PublicHeader } from '@/components/layout/public-header'
import { CurrencyProvider } from '@/lib/currency/context'

type CurrencyProviderProps = Parameters<typeof CurrencyProvider>[0]

interface PickupPassedScreenProps {
  /** Booking or trip number, shown so the customer can quote it to support. */
  reference: string
  /** Null for a guest booking. */
  user: User | null
  profile: Parameters<typeof PublicHeader>[0]['initialProfile']
  currency: Omit<CurrencyProviderProps, 'children'>
  /** Why the booking can no longer be paid. Defaults to the pickup having passed. */
  reason?: 'pickup_passed' | 'closed'
}

const COPY = {
  pickup_passed: {
    title: 'This pickup time has passed',
    subtitle:
      'This booking was never paid, and its pickup time has now gone, so it can no longer be paid for. Nothing has been charged. Search again to book a new time.',
  },
  closed: {
    title: 'This booking is no longer held',
    subtitle:
      'This booking was not paid in time, so the vehicle is no longer held and it can no longer be paid for. Nothing has been charged. Search again to book.',
  },
} as const

/**
 * Shown in place of the card form when an unpaid booking can no longer be paid:
 * its pickup time has gone, or it was cancelled or expired unpaid. No
 * PaymentIntent is created, so nothing can be charged.
 */
export function PickupPassedScreen({ reference, user, profile, currency, reason = 'pickup_passed' }: PickupPassedScreenProps) {
  const copy = COPY[reason]
  return (
    <CurrencyProvider {...currency}>
      <div className="min-h-screen bg-[var(--black-void)] flex flex-col">
        <PublicHeader initialUser={user} initialProfile={profile} />
        <header className="pt-20 md:pt-24 pb-8 md:pb-10">
          <div className="luxury-container pt-4 md:pt-6 lg:pt-8">
            <ProgressBar currentStep={4} />
            <div className="mt-8">
              <CheckoutHeading
                eyebrow={null}
                title={copy.title}
                subtitle={copy.subtitle}
              />
            </div>
            <p className="mt-4 text-[0.8125rem] tabular-nums text-[var(--text-muted)]">Reference {reference}</p>
          </div>
        </header>
        <main className="flex-1 pb-16">
          <div className="luxury-container">
            <Link href="/" className="editorial-action">
              Search again
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </main>
        <SecureFooter />
      </div>
    </CurrencyProvider>
  )
}
