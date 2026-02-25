export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PublicHeader } from '@/components/layout/public-header'
import { Hero } from '@/components/home/hero'
import { DeparturePoints } from '@/components/home/departure-points'
import { TransportationBenefits } from '@/components/home/transportation-benefits'
import { VehicleClasses } from '@/components/home/vehicle-classes'
import { AdditionalServices } from '@/components/home/additional-services'
import { Testimonials } from '@/components/home/testimonials'
import { JoinCommunity } from '@/components/home/join-community'
import { FAQ } from '@/components/home/faq'
import { Footer } from '@/components/layout/footer'
import { StatsRibbon } from '@/components/home/stats-ribbon'
import { getEnabledCurrencies, getFeaturedCurrencies, getDefaultCurrency, getExchangeRatesObject } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'
import { CurrencyProvider } from '@/lib/currency/context'

export const metadata = {
  title: 'VehicleService - Premier Luxury Transportation',
  description: 'Experience unparalleled luxury, comfort, and reliability with our premier transfer services.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const todayStr = new Date().toISOString().split('T')[0]

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Fetch currency data
  const [featuredCurrencies, allEnabledCurrencies, defaultCurrency, exchangeRates] = await Promise.all([
    getFeaturedCurrencies(),
    getEnabledCurrencies(),
    getDefaultCurrency(),
    getExchangeRatesObject(),
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
    <main className="bg-luxury-black">
      <PublicHeader
        initialUser={user}
        initialProfile={profile}
      />
      <Hero todayDate={todayStr} />
      <StatsRibbon />
      <div className="bg-luxury-darkGray">
        <DeparturePoints todayDate={todayStr} />
      </div>
      <div className="bg-luxury-black">
        <TransportationBenefits />
      </div>
      <div className="bg-luxury-darkGray" id="fleet">
        <VehicleClasses />
      </div>
      <div className="bg-luxury-black" id="services">
        <AdditionalServices />
      </div>
      <div className="bg-luxury-darkGray">
        <Testimonials />
      </div>
            <div className="bg-luxury-darkGray">
        <JoinCommunity />
      </div>
      <div className="bg-luxury-black" id="faq">
        <FAQ />
      </div>
      <Footer />
    </main>
    </CurrencyProvider>
  )
}
