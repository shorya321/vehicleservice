import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PublicHeader } from './public-header'
import { Footer } from './footer'
import { getFeaturedCurrencies, getEnabledCurrencies, getDefaultCurrency, getExchangeRatesObject } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'
import { CurrencyProvider } from '@/lib/currency/context'

export async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const cookieStore = await cookies()

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
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader
          initialUser={user}
          initialProfile={profile}
        />
        <main className="flex-1 pt-20 md:pt-24">
          {children}
        </main>
        <Footer />
      </div>
    </CurrencyProvider>
  )
}
