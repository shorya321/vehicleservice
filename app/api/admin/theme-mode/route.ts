/**
 * Admin Theme Mode Toggle API
 * Quick toggle between dark and light mode
 *
 * POST /api/admin/theme-mode
 * Body: { mode: "dark" | "light" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const THEME_SETTINGS_NAME = 'admin-vendor-portal'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const newMode = body.mode

    if (newMode !== 'dark' && newMode !== 'light') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "dark" or "light"' },
        { status: 400 }
      )
    }

    // Get current theme config
    const { data: currentTheme, error: fetchError } = await supabase
      .from('theme_settings')
      .select('config')
      .eq('name', THEME_SETTINGS_NAME)
      .single()

    if (fetchError || !currentTheme) {
      return NextResponse.json(
        { error: 'Failed to fetch current theme' },
        { status: 500 }
      )
    }

    // Update mode in config
    const updatedConfig = {
      ...currentTheme.config,
      mode: newMode,
    }

    // Save updated config
    const { error: updateError } = await supabase
      .from('theme_settings')
      .update({
        config: updatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('name', THEME_SETTINGS_NAME)

    if (updateError) {
      console.error('Failed to update theme mode:', updateError)
      return NextResponse.json(
        { error: 'Failed to update theme mode' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mode: newMode,
    })
  } catch (error) {
    console.error('Theme mode API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
