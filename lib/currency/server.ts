/**
 * Currency Server Utilities
 *
 * Server-side utilities for fetching currencies and exchange rates.
 * Uses unstable_cache for efficient caching in Server Components.
 */

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CurrencySetting, CurrencyInfo, ExchangeRatesMap } from './types'
import { DEFAULT_CURRENCY_CODE } from './types'

/**
 * Cache tags for revalidation
 */
const CACHE_TAGS = {
  currencies: 'currencies',
  exchangeRates: 'exchange-rates',
}

/**
 * Fetch enabled currencies from database
 * Cached for 1 hour, revalidated on currency settings change
 * Note: Uses admin client to avoid cookies() conflict with unstable_cache
 */
export const getEnabledCurrencies = unstable_cache(
  async (): Promise<CurrencyInfo[]> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('currency_settings')
        .select('currency_code, name, symbol, decimal_places, is_default, is_featured, display_order')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('[Currency] Error fetching enabled currencies:', error)
        return getDefaultCurrencies()
      }

      if (!data || data.length === 0) {
        return getDefaultCurrencies()
      }

      return data.map((c) => ({
        code: c.currency_code,
        name: c.name,
        symbol: c.symbol,
        decimalPlaces: c.decimal_places ?? 2,
        isDefault: c.is_default ?? false,
        isFeatured: c.is_featured ?? false,
      }))
    } catch (error) {
      console.error('[Currency] Error in getEnabledCurrencies:', error)
      return getDefaultCurrencies()
    }
  },
  ['enabled-currencies'],
  {
    revalidate: 3600, // 1 hour
    tags: [CACHE_TAGS.currencies],
  }
)

/**
 * Fetch featured currencies (enabled + featured)
 * Cached for 1 hour, revalidated on currency settings change
 */
export const getFeaturedCurrencies = unstable_cache(
  async (): Promise<CurrencyInfo[]> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('currency_settings')
        .select('currency_code, name, symbol, decimal_places, is_default, is_featured, display_order')
        .eq('is_enabled', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('[Currency] Error fetching featured currencies:', error)
        return getDefaultCurrencies()
      }

      if (!data || data.length === 0) {
        return getDefaultCurrencies()
      }

      return data.map((c) => ({
        code: c.currency_code,
        name: c.name,
        symbol: c.symbol,
        decimalPlaces: c.decimal_places ?? 2,
        isDefault: c.is_default ?? false,
        isFeatured: true,
      }))
    } catch (error) {
      console.error('[Currency] Error in getFeaturedCurrencies:', error)
      return getDefaultCurrencies()
    }
  },
  ['featured-currencies'],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.currencies],
  }
)

/**
 * Paginated currencies for admin panel
 */
export async function getPaginatedCurrencies({
  page = 1,
  limit = 10,
  search,
  filter,
}: {
  page?: number
  limit?: number
  search?: string
  filter?: 'all' | 'enabled' | 'featured' | 'disabled'
}): Promise<{
  currencies: CurrencySetting[]
  total: number
  page: number
  totalPages: number
}> {
  try {
    const adminClient = createAdminClient()

    let query = adminClient
      .from('currency_settings')
      .select('*', { count: 'exact' })

    // Apply filter
    if (filter === 'enabled') {
      query = query.eq('is_enabled', true)
    } else if (filter === 'featured') {
      query = query.eq('is_featured', true)
    } else if (filter === 'disabled') {
      query = query.eq('is_enabled', false)
    }

    // Apply search
    if (search) {
      query = query.or(`currency_code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Get total count
    const { count } = await query

    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // Re-build query for data fetch (Supabase doesn't allow reusing after count)
    let dataQuery = adminClient
      .from('currency_settings')
      .select('*')

    if (filter === 'enabled') {
      dataQuery = dataQuery.eq('is_enabled', true)
    } else if (filter === 'featured') {
      dataQuery = dataQuery.eq('is_featured', true)
    } else if (filter === 'disabled') {
      dataQuery = dataQuery.eq('is_enabled', false)
    }

    if (search) {
      dataQuery = dataQuery.or(`currency_code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    const { data, error } = await dataQuery
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Currency] Error fetching paginated currencies:', error)
      return { currencies: [], total: 0, page, totalPages: 0 }
    }

    return {
      currencies: data || [],
      total,
      page,
      totalPages,
    }
  } catch (error) {
    console.error('[Currency] Error in getPaginatedCurrencies:', error)
    return { currencies: [], total: 0, page, totalPages: 0 }
  }
}

/**
 * Fetch all currencies from database (for admin)
 */
export async function getAllCurrencies(): Promise<CurrencySetting[]> {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('currency_settings')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Currency] Error fetching all currencies:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Currency] Error in getAllCurrencies:', error)
    return []
  }
}

/**
 * Fetch exchange rates from database
 * Cached for 1 hour, revalidated on rate refresh
 * Note: Uses admin client to avoid cookies() conflict with unstable_cache
 * Returns plain object (not Map) for proper serialization with unstable_cache
 */
export const getExchangeRates = unstable_cache(
  async (): Promise<ExchangeRatesMap> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('exchange_rates')
        .select('target_currency, rate')
        .eq('base_currency', 'AED')

      if (error) {
        console.error('[Currency] Error fetching exchange rates:', error)
        return getDefaultRates()
      }

      if (!data || data.length === 0) {
        return getDefaultRates()
      }

      const rates: Record<string, number> = {}
      for (const row of data) {
        rates[row.target_currency] = parseFloat(String(row.rate))
      }

      // Ensure AED rate is always 1
      rates['AED'] = 1.0

      return rates
    } catch (error) {
      console.error('[Currency] Error in getExchangeRates:', error)
      return getDefaultRates()
    }
  },
  ['exchange-rates'],
  {
    revalidate: 3600, // 1 hour
    tags: [CACHE_TAGS.exchangeRates],
  }
)

/**
 * Get exchange rates as plain object (for client components)
 * Now simply returns the rates since getExchangeRates already returns a plain object
 */
export async function getExchangeRatesObject(): Promise<Record<string, number>> {
  return await getExchangeRates()
}

/**
 * Get default currency code from database
 * Note: Uses admin client to avoid cookies() conflict with unstable_cache
 */
export const getDefaultCurrency = unstable_cache(
  async (): Promise<string> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('currency_settings')
        .select('currency_code')
        .eq('is_default', true)
        .single()

      if (error || !data) {
        return DEFAULT_CURRENCY_CODE
      }

      return data.currency_code
    } catch (error) {
      console.error('[Currency] Error in getDefaultCurrency:', error)
      return DEFAULT_CURRENCY_CODE
    }
  },
  ['default-currency'],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.currencies],
  }
)

/**
 * Validate if a currency code is enabled
 */
export async function isCurrencyEnabled(code: string): Promise<boolean> {
  const currencies = await getEnabledCurrencies()
  return currencies.some((c) => c.code === code)
}

/**
 * Get currency info by code
 */
export async function getCurrencyInfo(code: string): Promise<CurrencyInfo | null> {
  const currencies = await getEnabledCurrencies()
  return currencies.find((c) => c.code === code) || null
}

/**
 * Get last exchange rate update time
 * Note: Uses admin client for consistency with other server functions
 */
export async function getLastRateUpdate(): Promise<Date | null> {
  try {
    const supabase = createAdminClient()

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
  } catch (error) {
    console.error('[Currency] Error getting last rate update:', error)
    return null
  }
}

/**
 * Check if rates are stale (older than 24 hours)
 */
export async function areRatesStale(): Promise<boolean> {
  const lastUpdate = await getLastRateUpdate()
  if (!lastUpdate) return true

  const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
  return hoursSinceUpdate > 24
}

/**
 * Default currencies fallback
 */
function getDefaultCurrencies(): CurrencyInfo[] {
  return [
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, isDefault: true, isFeatured: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isDefault: false, isFeatured: true },
    { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false, isFeatured: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isDefault: false, isFeatured: true },
  ]
}

/**
 * Default rates fallback (rates relative to AED base)
 * Returns plain object for consistency with getExchangeRates
 * Values represent: 1 AED = X target currency
 */
function getDefaultRates(): ExchangeRatesMap {
  return {
    AED: 1.0,
    USD: 0.27,
    EUR: 0.25,
    GBP: 0.22,
    AUD: 0.41,
    CAD: 0.37,
    CHF: 0.24,
    SAR: 1.02,
    SGD: 0.37,
    INR: 22.65,
    JPY: 40.74,
  }
}
