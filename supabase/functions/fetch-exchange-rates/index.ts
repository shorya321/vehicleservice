/**
 * Fetch Exchange Rates Edge Function
 *
 * Fetches latest exchange rates from Hexarate (hexarate.paikama.co) and updates the database.
 * Hexarate is a free API with no key required that supports AED as base currency.
 *
 * Features:
 * - Daily rate refresh via CRON or manual trigger
 * - Parallel fetch for all target currencies
 * - Fallback to cached rates on API failure
 * - Comprehensive error handling and logging
 *
 * Environment Variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin access
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Initialize Supabase Admin Client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hexarate API configuration (free, no API key required)
const HEXARATE_BASE_URL = 'https://hexarate.paikama.co/api/rates'

// Fallback currencies if DB query fails
const FALLBACK_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP']

/**
 * Get enabled currencies from database (dynamic list)
 */
async function getEnabledCurrenciesFromDb(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('currency_settings')
      .select('currency_code')
      .eq('is_enabled', true)

    if (error || !data || data.length === 0) {
      console.error('[Exchange Rates] Error fetching enabled currencies from DB:', error)
      return FALLBACK_CURRENCIES
    }

    return data.map(c => c.currency_code)
  } catch (error) {
    console.error('[Exchange Rates] Failed to query enabled currencies:', error)
    return FALLBACK_CURRENCIES
  }
}

interface HexarateResponse {
  status_code: number
  data: {
    base: string
    target: string
    mid: number
    unit: number
    timestamp: string
  }
}

interface ExchangeRateRecord {
  base_currency: string
  target_currency: string
  rate: number
  fetched_at: string
}

/**
 * Fetch exchange rates from Hexarate (one request per currency pair, in parallel)
 */
async function fetchRatesFromApi(currencies: string[]): Promise<Record<string, number> | null> {
  const targets = currencies.filter(c => c !== 'AED')

  try {
    console.log(`[Exchange Rates] Fetching ${targets.length} rates from Hexarate (base: AED)...`)

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        const url = `${HEXARATE_BASE_URL}/AED/${target}/latest`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} for ${target}`)
        }

        const data: HexarateResponse = await response.json()

        if (data.status_code !== 200 || !data.data?.mid) {
          throw new Error(`Invalid response for ${target}: status ${data.status_code}`)
        }

        return { currency: target, rate: data.data.mid }
      })
    )

    const rates: Record<string, number> = { AED: 1.0 }
    let successCount = 0
    let failCount = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        rates[result.value.currency] = result.value.rate
        successCount++
      } else {
        console.error(`[Exchange Rates] Failed to fetch rate:`, result.reason)
        failCount++
      }
    }

    console.log(`[Exchange Rates] Fetched ${successCount}/${targets.length} rates (${failCount} failed)`)

    // Require at least half the rates to succeed
    if (successCount < targets.length / 2) {
      console.error('[Exchange Rates] Too many failures, aborting')
      return null
    }

    return rates
  } catch (error) {
    console.error('[Exchange Rates] Error fetching from Hexarate:', error)
    return null
  }
}

/**
 * Update exchange rates in the database
 */
async function updateRatesInDatabase(rates: Record<string, number>, currencies: string[]): Promise<{ updated: number; failed: number }> {
  const fetchedAt = new Date().toISOString()
  let updated = 0
  let failed = 0

  // Prepare upsert records
  const records: ExchangeRateRecord[] = currencies.map(currency => ({
    base_currency: 'AED',
    target_currency: currency,
    rate: rates[currency] || 1.0,
    fetched_at: fetchedAt,
  }))

  // Upsert all records
  for (const record of records) {
    const { error } = await supabase
      .from('exchange_rates')
      .upsert(record, {
        onConflict: 'base_currency,target_currency',
      })

    if (error) {
      console.error(`[Exchange Rates] Failed to update ${record.target_currency}:`, error)
      failed++
    } else {
      updated++
    }
  }

  console.log(`[Exchange Rates] Database update complete: ${updated} updated, ${failed} failed`)

  return { updated, failed }
}

/**
 * Get current rates from database (fallback)
 */
async function getCurrentRatesFromDb(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('target_currency, rate')
    .eq('base_currency', 'AED')

  if (error || !data) {
    console.error('[Exchange Rates] Error fetching current rates from DB:', error)
    return {}
  }

  const rates: Record<string, number> = {}
  for (const row of data) {
    rates[row.target_currency] = parseFloat(row.rate)
  }

  return rates
}

/**
 * Get last fetch timestamp
 */
async function getLastFetchTime(): Promise<Date | null> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('fetched_at')
    .eq('base_currency', 'AED')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return new Date(data.fetched_at)
}

/**
 * Check if rates are stale (older than 24 hours)
 */
function areRatesStale(lastFetch: Date | null): boolean {
  if (!lastFetch) return true

  const hoursSinceLastFetch = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60)
  return hoursSinceLastFetch > 24
}

/**
 * Main handler for refreshing exchange rates
 */
async function refreshExchangeRates(forceRefresh: boolean = false): Promise<{
  success: boolean
  message: string
  rates?: Record<string, number>
  source: 'api' | 'cache' | 'fallback'
  lastUpdated?: string
}> {
  console.log(`[Exchange Rates] Starting refresh (force: ${forceRefresh})`)

  // Check last fetch time
  const lastFetch = await getLastFetchTime()
  const stale = areRatesStale(lastFetch)

  console.log(`[Exchange Rates] Last fetch: ${lastFetch?.toISOString() || 'never'}, Stale: ${stale}`)

  // Get enabled currencies from database
  const enabledCurrencies = await getEnabledCurrenciesFromDb()
  console.log(`[Exchange Rates] Enabled currencies: ${enabledCurrencies.join(', ')}`)

  // If not forced and rates are fresh, return cached rates
  if (!forceRefresh && !stale && lastFetch) {
    console.log('[Exchange Rates] Rates are fresh, using cached values')
    const cachedRates = await getCurrentRatesFromDb()
    return {
      success: true,
      message: 'Rates are up to date',
      rates: cachedRates,
      source: 'cache',
      lastUpdated: lastFetch.toISOString(),
    }
  }

  // Fetch new rates from API
  const apiRates = await fetchRatesFromApi(enabledCurrencies)

  if (apiRates) {
    // API fetch successful - update database
    const { updated, failed } = await updateRatesInDatabase(apiRates, enabledCurrencies)

    if (updated > 0) {
      return {
        success: true,
        message: `Successfully updated ${updated} exchange rates`,
        rates: apiRates,
        source: 'api',
        lastUpdated: new Date().toISOString(),
      }
    } else {
      console.error('[Exchange Rates] All database updates failed')
    }
  }

  // API fetch failed - use cached rates if available
  console.warn('[Exchange Rates] API fetch failed, falling back to cached rates')
  const cachedRates = await getCurrentRatesFromDb()

  if (Object.keys(cachedRates).length > 0) {
    return {
      success: true,
      message: 'Using cached rates (API unavailable)',
      rates: cachedRates,
      source: 'fallback',
      lastUpdated: lastFetch?.toISOString(),
    }
  }

  // No cached rates available - return error
  return {
    success: false,
    message: 'Failed to fetch exchange rates and no cache available',
    source: 'fallback',
  }
}

/**
 * Get status of exchange rates (for admin panel)
 */
async function getStatus(): Promise<{
  lastUpdated: string | null
  isStale: boolean
  rateCount: number
  rates: Record<string, number>
}> {
  const lastFetch = await getLastFetchTime()
  const rates = await getCurrentRatesFromDb()

  return {
    lastUpdated: lastFetch?.toISOString() || null,
    isStale: areRatesStale(lastFetch),
    rateCount: Object.keys(rates).length,
    rates,
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname

    // Route: Refresh rates (POST)
    if (req.method === 'POST') {
      let forceRefresh = false

      try {
        const body = await req.json()
        forceRefresh = body.force === true
      } catch {
        // No body or invalid JSON - use default
      }

      const result = await refreshExchangeRates(forceRefresh)

      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Route: Get status (GET)
    if (req.method === 'GET') {
      // Check for status query param
      if (url.searchParams.get('status') === 'true') {
        const status = await getStatus()
        return new Response(
          JSON.stringify(status),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Default: Refresh rates (for CRON)
      const result = await refreshExchangeRates(false)
      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Unknown method
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Exchange Rates] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
