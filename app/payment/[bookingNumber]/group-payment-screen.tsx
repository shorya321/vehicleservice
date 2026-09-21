import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { HelpCircle } from 'lucide-react'
import { PaymentWrapper } from '../components/payment-wrapper'
import { SecureFooter } from '../components/secure-footer'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { CheckoutHeading } from '@/components/checkout/checkout-heading'
import { BookingLedger } from '@/components/checkout/booking-ledger'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'
import { CurrencyProvider } from '@/lib/currency/context'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import type { GroupForPayment } from '../lib/group-payment'

type CurrencyProviderProps = Parameters<typeof CurrencyProvider>[0]

interface GroupPaymentScreenProps {
  group: GroupForPayment
  clientSecret: string | null
  stripeError: string | null
  user: User
  profile: Parameters<typeof PublicHeader>[0]['initialProfile']
  currency: Omit<CurrencyProviderProps, 'children'>
  siteSettings: SiteSettingsConfig
}

/**
 * The payment step for a round trip or multi-city trip: one charge for every journey,
 * with each journey listed in the summary card the customer has had since checkout.
 */
export function GroupPaymentScreen({
  group,
  clientSecret,
  stripeError,
  user,
  profile,
  currency,
  siteSettings,
}: GroupPaymentScreenProps) {
  const heading = group.tripType === 'round_trip' ? 'Your round trip' : 'Your trip'

  return (
    <CurrencyProvider {...currency}>
      <div className="min-h-screen bg-[var(--black-void)] flex flex-col">
        <PublicHeader initialUser={user} initialProfile={profile} />
        <header className="pt-20 md:pt-24 pb-8 md:pb-10 product-entrance">
          <div className="luxury-container pt-4 md:pt-6 lg:pt-8">
            <ProgressBar currentStep={4} />
            <div className="mt-8">
              <CheckoutHeading
                eyebrow={null}
                title="Confirm and pay"
                subtitle="One payment covers every journey. Each journey is free to cancel up to 24 hours before its pickup."
              />
            </div>
            <p className="mt-4 text-[0.8125rem] tabular-nums text-[var(--text-muted)]">
              Trip {group.groupNumber}
            </p>
          </div>
        </header>
        <main className="flex-1 pb-16">
          <div className="luxury-container">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 lg:items-start">
              <div className="flex-1 min-w-0">
                {clientSecret && !stripeError ? (
                  <PaymentWrapper
                    clientSecret={clientSecret}
                    bookingId=""
                    groupId={group.id}
                    amount={group.total}
                    bookingNumber={group.groupNumber}
                    tripNumber={group.groupNumber}
                  />
                ) : (
                  <div className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.12)] p-6 text-[var(--text-secondary)]">
                    {stripeError || 'Payment processing is currently unavailable.'} Your trip {group.groupNumber} is
                    saved and has not been charged.
                  </div>
                )}
              </div>
              <aside
                className="order-first lg:order-last w-full max-w-[520px] lg:max-w-none lg:w-[380px] xl:w-[420px] flex-shrink-0 lg:sticky lg:top-24 product-entrance--sidebar"
                aria-label="Booking summary"
              >
                <div className="checkout-summary-card">
                  <div className="checkout-stub-cap">
                    <h2 className="checkout-section-title editorial-eyebrow--pill"><i aria-hidden="true" />{heading}</h2>
                    <span className="checkout-stub-ref">{group.ledgerLegs.length} journeys</span>
                  </div>
                  <BookingLedger
                    category={null}
                    vehicleName={group.vehicleName ?? 'Your transfer'}
                    originName={group.ledgerLegs[0]?.originName ?? ''}
                    destinationName={group.ledgerLegs[0]?.destinationName ?? ''}
                    passengers={group.passengerCount}
                    luggage={group.luggage}
                    seats={group.seats}
                    basePrice={group.subtotal - group.amenitiesTotal}
                    legs={group.ledgerLegs}
                    tripDiscount={
                      group.discount > 0
                        ? { label: `Round trip saving (${group.discountPercent}%)`, amount: group.discount }
                        : null
                    }
                    addons={
                      group.amenitiesTotal > 0
                        ? [{ id: 'amenities', name: 'Additional services', quantity: 1, total_price: group.amenitiesTotal }]
                        : []
                    }
                    total={group.total}
                  />
                  <div className="px-6 xl:px-8 py-5 border-t border-[var(--stub-line)]">
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] text-[0.8125rem] text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stub-bot)] rounded-[4px]"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Need help with your booking?
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
        {clientSecret && !stripeError ? <Footer siteSettings={siteSettings} /> : <SecureFooter />}
      </div>
    </CurrencyProvider>
  )
}
