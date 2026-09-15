export const dynamic = 'force-dynamic'

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

  const { data: { user } } = await supabase.auth.getUser()

  let profile: HeaderProfile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select(HEADER_PROFILE_COLUMNS)
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Fetch currency data and site settings
  const [featuredCurrencies, allEnabledCurrencies, defaultCurrency, exchangeRates, siteSettings] = await Promise.all([
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
      <Hero todayDate={todayStr} />
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
      <div className="border-t border-[var(--graphite)]">
        <Testimonials />
      </div>
      <JoinCommunity />
      <FAQ />
    </main>
      <Footer siteSettings={siteSettings} />
    </div>
    </CurrencyProvider>
  )
}
