/**
 * Admin Portal - Currency Settings Page
 * Configure enabled currencies and view exchange rates
 *
 * Features:
 * - Enable/disable currencies for public display
 * - Set default currency
 * - Toggle featured currencies for frontend quick selector
 * - View current exchange rates
 * - Manual rate refresh
 * - Paginated table with search and filters
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Coins, AlertTriangle, Clock, Info, Star } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { getPaginatedCurrencies, getExchangeRatesObject, getLastRateUpdate, areRatesStale } from '@/lib/currency/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CurrencyTable } from './components/currency-table'
import { CurrencyFilters } from './components/currency-filters'
import { CurrencyPagination } from './components/currency-pagination'
import { RefreshRatesButton } from './components/refresh-rates-button'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = {
  title: 'Currency Settings | Admin Portal',
  description: 'Configure currencies and exchange rates',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    filter?: string
  }>
}

export default async function CurrencySettingsPage({ searchParams }: PageProps) {
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

  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const search = params.search || ''
  const filter = (params.filter || 'all') as 'all' | 'enabled' | 'featured' | 'disabled'

  // Fetch counts for stats cards
  const adminClient = createAdminClient()
  const [paginatedResult, rates, lastUpdate, stale, countResult] = await Promise.all([
    getPaginatedCurrencies({ page, limit: 10, search: search || undefined, filter }),
    getExchangeRatesObject(),
    getLastRateUpdate(),
    areRatesStale(),
    adminClient.from('currency_settings').select('is_enabled, is_default, is_featured'),
  ])

  const allCurrencies = countResult.data || []
  const totalCount = allCurrencies.length
  const enabledCount = allCurrencies.filter(c => c.is_enabled).length
  const featuredCount = allCurrencies.filter(c => c.is_featured).length
  const defaultCurrency = allCurrencies.find(c => c.is_default)

  // Get the default currency code from the paginated results or fallback
  let defaultCurrencyCode = 'AED'
  if (defaultCurrency) {
    // We need to fetch the code separately since our count query only got flags
    const { data: defData } = await adminClient
      .from('currency_settings')
      .select('currency_code, symbol')
      .eq('is_default', true)
      .single()
    if (defData) {
      defaultCurrencyCode = defData.currency_code
    }
  }

  return (
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
              All payments are processed in {defaultCurrencyCode}.
            </p>
          </div>

          {/* Stale Rates Warning */}
          {stale && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Exchange rates are outdated</AlertTitle>
              <AlertDescription>
                Rates have not been updated in over 24 hours. Click &quot;Refresh Rates&quot; to update,
                or check the Hexarate API status.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <AnimatedCard delay={0.1}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Currencies</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                      <Coins className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{totalCount}</span>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.2}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Enabled Currencies</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                      <Coins className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{enabledCount}</span>
                    <span className="text-sm text-muted-foreground">of {totalCount}</span>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Featured Currencies</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                      <Star className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{featuredCount}</span>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Rates Last Updated</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                      <Clock className="h-4 w-4 text-sky-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
            </AnimatedCard>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Display-Only Conversion</AlertTitle>
            <AlertDescription>
              Currency conversion is for display purposes only. Customers see prices in their
              preferred currency, but all payments are processed in {defaultCurrencyCode}.
              Featured currencies appear in the quick selector dropdown on the frontend.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <CurrencyFilters />

          {/* Currency Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Currencies</CardTitle>
                <CardDescription>
                  Enable currencies to make them available in the currency selector.
                  Feature currencies to show them in the quick dropdown.
                </CardDescription>
              </div>
              <RefreshRatesButton />
            </CardHeader>
            <CardContent className="p-0">
              <CurrencyTable
                currencies={paginatedResult.currencies}
                rates={rates}
                defaultCurrencyCode={defaultCurrencyCode}
              />
            </CardContent>
          </Card>

          {/* Pagination */}
          <CurrencyPagination
            currentPage={paginatedResult.page}
            totalPages={paginatedResult.totalPages}
            totalCount={paginatedResult.total}
          />

          {/* Exchange Rate Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exchange Rate Source</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Exchange rates are fetched from Hexarate (hexarate.paikama.co) &mdash; a free service
                with no API key required. Rates update automatically daily at 6:00 AM UTC.
                Only enabled currencies have their rates fetched.
              </p>
              <p>
                Click &quot;Refresh Rates&quot; above for an immediate update, or rates will
                refresh automatically via the scheduled CRON job.
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
  )
}
