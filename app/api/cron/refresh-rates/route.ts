/**
 * CRON Endpoint - Refresh Exchange Rates
 *
 * Automatically refreshes exchange rates daily via Vercel CRON.
 * Calls the Supabase edge function to fetch latest rates from CurrencyAPI.net.
 *
 * Schedule: Daily at 6:00 AM UTC (configured in vercel.json)
 */

import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify CRON secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow requests from Vercel CRON (no auth needed) or with valid secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check if this is a Vercel CRON request (has special header)
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
    if (!isVercelCron) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[CRON Refresh Rates] Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('[CRON Refresh Rates] Starting scheduled rate refresh...')

    // Call the edge function to refresh rates
    const response = await fetch(
      `${supabaseUrl}/functions/v1/fetch-exchange-rates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('[CRON Refresh Rates] Edge function failed:', result)
      return NextResponse.json(
        { error: 'Failed to refresh rates', details: result },
        { status: 500 }
      )
    }

    console.log('[CRON Refresh Rates] Rate refresh completed:', result.message)

    return NextResponse.json({
      success: true,
      message: result.message,
      source: result.source,
      lastUpdated: result.lastUpdated,
      ratesUpdated: result.rates ? Object.keys(result.rates).length : 0,
    })
  } catch (error) {
    console.error('[CRON Refresh Rates] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
