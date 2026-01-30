import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PublicHeader } from './public-header'
import { Footer } from './footer'
import { getEnabledCurrencies, getDefaultCurrency } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'

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
  const [currencies, defaultCurrency] = await Promise.all([
    getEnabledCurrencies(),
    getDefaultCurrency(),
  ])

  // Get user's currency preference from cookie
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader
        initialUser={user}
        initialProfile={profile}
        currencies={currencies}
        currentCurrency={currentCurrency}
      />
      <main className="flex-1 pt-20 md:pt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}
