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
  user: User
  profile: Parameters<typeof PublicHeader>[0]['initialProfile']
  currency: Omit<CurrencyProviderProps, 'children'>
}

/**
 * Shown in place of the card form when an unpaid booking's pickup time has
 * already gone. No PaymentIntent is created, so nothing can be charged.
 */
export function PickupPassedScreen({ reference, user, profile, currency }: PickupPassedScreenProps) {
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
                title="This pickup time has passed"
                subtitle="This booking was never paid, and its pickup time has now gone, so it can no longer be paid for. Nothing has been charged. Search again to book a new time."
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
