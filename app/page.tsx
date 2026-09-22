export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { User } from '@supabase/supabase-js'
import { bookingToday } from "@/lib/utils/timezone"
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PublicHeader } from '@/components/layout/public-header'
import { Hero } from '@/components/home/hero'
import { AfterYouBook } from '@/components/home/after-you-book'
import { DeparturePoints } from '@/components/home/departure-points'
import { Cities } from '@/components/home/cities'
import { TransportationBenefits } from '@/components/home/transportation-benefits'
import { VehicleClasses } from '@/components/home/vehicle-classes'
import { AdditionalServices } from '@/components/home/additional-services'
import { Testimonials } from '@/components/home/testimonials'
import { JoinCommunity } from '@/components/home/join-community'
import { FAQ } from '@/components/home/faq'
import { Footer } from '@/components/layout/footer'
import { getEnabledCurrencies, getFeaturedCurrencies, getDefaultCurrency, getExchangeRatesObject } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'
import { CurrencyProvider } from '@/lib/currency/context'
import { getSiteSettings } from '@/lib/site-settings/server'
import { HEADER_PROFILE_COLUMNS, type HeaderProfile } from '@/components/layout/header-profile'

export const metadata = {
  title: 'Infinia Transfers - Airport & City Transfers, Fixed-Price',
  description: 'Book private airport and city transfers with fixed pricing. Chauffeur at the gate, no surge fees.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const todayStr = bookingToday()

  // Auth and profile run alongside the cached reads: none of them depends on
  // the user, so waiting for getUser first only delays the whole page.
  const loadHeaderUser = async (): Promise<{ user: User | null; profile: HeaderProfile | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }

    const { data } = await supabase
      .from('profiles')
      .select(HEADER_PROFILE_COLUMNS)
      .eq('id', user.id)
      .single()
    return { user, profile: data }
  }

  const [{ user, profile }, featuredCurrencies, allEnabledCurrencies, defaultCurrency, exchangeRates, siteSettings] = await Promise.all([
    loadHeaderUser(),
    getFeaturedCurrencies(),
    getEnabledCurrencies(),
    getDefaultCurrency(),
    getExchangeRatesObject(),
    getSiteSettings(),
  ])

  // Get user's currency preference from cookie
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency

  return (
    <CurrencyProvider
      initialCurrency={currentCurrency}
      exchangeRates={exchangeRates}
      featuredCurrencies={featuredCurrencies}
      allCurrencies={allEnabledCurrencies}
    >
    <a
        href="#main-content"
        className="skip-nav"
      >
        Skip to main content
      </a>
    {/* Header and footer sit outside <main> so they keep their banner and
        contentinfo landmarks, and the skip link lands past the navigation. */}
    <div className="bg-[var(--black-void)]">
      <PublicHeader
        initialUser={user}
        initialProfile={profile}
        siteSettings={siteSettings}
      />
    <main id="main-content" tabIndex={-1} className="outline-none">
      <Hero todayDate={todayStr} tripSettings={siteSettings.trip_types} />
      <AfterYouBook />
      <div className="bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <DeparturePoints todayDate={todayStr} />
      </div>
      <div className="bg-[var(--black-rich)]">
        <Cities />
      </div>
      <div className="bg-[var(--black-void)]">
        <TransportationBenefits />
      </div>
      <div className="bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <VehicleClasses />
      </div>
      <div className="bg-[var(--black-void)]" id="services">
        <AdditionalServices />
      </div>
      {/* Testimonials reads uncached review data far below the fold, so it
          streams in rather than holding back the hero's HTML. */}
      <div className="border-t border-[var(--graphite)]">
        <Suspense fallback={null}>
          <Testimonials />
        </Suspense>
      </div>
      <JoinCommunity />
      <FAQ />
    </main>
      <Footer siteSettings={siteSettings} />
    </div>
    </CurrencyProvider>
  )
}
