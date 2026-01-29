/**
 * Admin Portal - Currency Settings Page
 * Configure enabled currencies and view exchange rates
 *
 * Features:
 * - Enable/disable currencies for public display
 * - Set default currency
 * - View current exchange rates
 * - Manual rate refresh
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Coins, AlertTriangle, Clock, Info } from 'lucide-react'
import { getAllCurrencies, getExchangeRatesObject, getLastRateUpdate, areRatesStale } from '@/lib/currency/server'
import { CurrencyTable } from './components/currency-table'
import { RefreshRatesButton } from './components/refresh-rates-button'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = {
  title: 'Currency Settings | Admin Portal',
  description: 'Configure currencies and exchange rates',
}

export default async function CurrencySettingsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Fetch data
  const [currencies, rates, lastUpdate, stale] = await Promise.all([
    getAllCurrencies(),
    getExchangeRatesObject(),
    getLastRateUpdate(),
    areRatesStale(),
  ])

  const enabledCount = currencies.filter(c => c.is_enabled).length
  const defaultCurrency = currencies.find(c => c.is_default)

  return (
    <AdminLayout>
      <AnimatedPage>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Currency Settings
              </h1>
            </div>
            <p className="text-muted-foreground">
              Configure which currencies are available for price display on the public website.
              All payments are processed in {defaultCurrency?.currency_code || 'AED'}.
            </p>
          </div>

          {/* Stale Rates Warning */}
          {stale && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Exchange rates are outdated</AlertTitle>
              <AlertDescription>
                Rates have not been updated in over 24 hours. Click &quot;Refresh Rates&quot; to update,
                or check the CurrencyAPI.net configuration.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Enabled Currencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{enabledCount}</span>
                  <span className="text-sm text-muted-foreground">of {currencies.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Default Currency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {defaultCurrency?.currency_code || 'AED'}
                  </span>
                  <Badge variant="outline">{defaultCurrency?.symbol || 'د.إ'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rates Last Updated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {lastUpdate
                      ? formatDistanceToNow(lastUpdate, { addSuffix: true })
                      : 'Never'}
                  </span>
                  {stale && (
                    <Badge variant="destructive" className="text-xs">Stale</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Display-Only Conversion</AlertTitle>
            <AlertDescription>
              Currency conversion is for display purposes only. Customers see prices in their
              preferred currency, but all payments are processed in {defaultCurrency?.currency_code || 'AED'}.
              The converted amount is shown at checkout for reference.
            </AlertDescription>
          </Alert>

          {/* Currency Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Currencies</CardTitle>
                <CardDescription>
                  Enable currencies to make them available in the currency selector
                </CardDescription>
              </div>
              <RefreshRatesButton />
            </CardHeader>
            <CardContent className="p-0">
              <CurrencyTable
                currencies={currencies}
                rates={rates}
                defaultCurrencyCode={defaultCurrency?.currency_code || 'AED'}
              />
            </CardContent>
          </Card>

          {/* API Configuration Note */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Exchange rates are fetched from CurrencyAPI.net. To enable automatic updates:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Sign up for a CurrencyAPI.net account</li>
                <li>Add your API key to the environment variable <code className="bg-muted px-1 py-0.5 rounded">CURRENCY_API_KEY</code></li>
                <li>Deploy the edge function and set up a daily CRON job</li>
              </ol>
              <p className="text-xs mt-4">
                Without API configuration, the system will use cached fallback rates.
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    </AdminLayout>
  )
}
