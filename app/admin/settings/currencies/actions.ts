'use server'

/**
 * Admin Currency Settings Server Actions
 *
 * Server actions for managing currency settings.
 */

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Toggle currency enabled status
 */
export async function toggleCurrencyEnabled(
  currencyCode: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    // Use admin client for the update
    const adminClient = createAdminClient()

    // Check if trying to disable the default currency
    if (!isEnabled) {
      const { data: currency } = await adminClient
        .from('currency_settings')
        .select('is_default')
        .eq('currency_code', currencyCode)
        .single()

      if (currency?.is_default) {
        return { success: false, error: 'Cannot disable the default currency' }
      }
    }

    // When disabling, also unfeature
    const updateData: Record<string, unknown> = {
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    }
    if (!isEnabled) {
      updateData.is_featured = false
    }

    const { error } = await adminClient
      .from('currency_settings')
      .update(updateData)
      .eq('currency_code', currencyCode)

    if (error) {
      console.error('[Currency] Error toggling currency:', error)
      return { success: false, error: error.message }
    }

    // Revalidate cache
    revalidateTag('currencies')
    revalidatePath('/admin/settings/currencies')

    return { success: true }
  } catch (error) {
    console.error('[Currency] Error in toggleCurrencyEnabled:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Toggle currency featured status
 */
export async function toggleCurrencyFeatured(
  currencyCode: string,
  isFeatured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()

    // If featuring, check currency is enabled first
    if (isFeatured) {
      const { data: currency } = await adminClient
        .from('currency_settings')
        .select('is_enabled')
        .eq('currency_code', currencyCode)
        .single()

      if (!currency?.is_enabled) {
        return { success: false, error: 'Currency must be enabled before featuring' }
      }
    }

    const { error } = await adminClient
      .from('currency_settings')
      .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
      .eq('currency_code', currencyCode)

    if (error) {
      console.error('[Currency] Error toggling featured:', error)
      return { success: false, error: error.message }
    }

    revalidateTag('currencies')
    revalidatePath('/admin/settings/currencies')

    return { success: true }
  } catch (error) {
    console.error('[Currency] Error in toggleCurrencyFeatured:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set default currency
 */
export async function setDefaultCurrency(
  currencyCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()

    // Check if currency is enabled
    const { data: currency } = await adminClient
      .from('currency_settings')
      .select('is_enabled')
      .eq('currency_code', currencyCode)
      .single()

    if (!currency?.is_enabled) {
      return { success: false, error: 'Currency must be enabled before setting as default' }
    }

    // Update default (trigger will handle unsetting previous default)
    const { error } = await adminClient
      .from('currency_settings')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('currency_code', currencyCode)

    if (error) {
      console.error('[Currency] Error setting default currency:', error)
      return { success: false, error: error.message }
    }

    // Revalidate cache
    revalidateTag('currencies')
    revalidatePath('/admin/settings/currencies')

    return { success: true }
  } catch (error) {
    console.error('[Currency] Error in setDefaultCurrency:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Refresh exchange rates from API
 */
export async function refreshExchangeRates(): Promise<{
  success: boolean
  message?: string
  error?: string
  source?: 'api' | 'cache' | 'fallback'
  rates?: Record<string, number>
  lastUpdated?: string
}> {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    // Call edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Supabase configuration missing' }
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/fetch-exchange-rates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Currency] Edge function error:', errorText)
      return { success: false, error: 'Failed to refresh rates' }
    }

    const result = await response.json()

    // Revalidate cache
    revalidateTag('exchange-rates')
    revalidatePath('/admin/settings/currencies')

    return {
      success: result.success,
      message: result.message,
      error: result.success ? undefined : result.message,
      source: result.source,
      rates: result.rates,
      lastUpdated: result.lastUpdated,
    }
  } catch (error) {
    console.error('[Currency] Error in refreshExchangeRates:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update currency display order
 */
export async function updateCurrencyOrder(
  currencyCode: string,
  newOrder: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('currency_settings')
      .update({ display_order: newOrder, updated_at: new Date().toISOString() })
      .eq('currency_code', currencyCode)

    if (error) {
      console.error('[Currency] Error updating order:', error)
      return { success: false, error: error.message }
    }

    revalidateTag('currencies')
    revalidatePath('/admin/settings/currencies')

    return { success: true }
  } catch (error) {
    console.error('[Currency] Error in updateCurrencyOrder:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
