/**
 * Admin Appearance Settings API
 * Update theme configuration for admin/vendor portals
 *
 * PUT /api/admin/appearance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AdminThemeConfig } from '@/lib/admin'

const THEME_SETTINGS_NAME = 'admin-vendor-portal'

export async function PUT(request: NextRequest) {
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
    const body: AdminThemeConfig = await request.json()

    // Validate required fields
    if (!body.mode || !body.accent || !body.dark || !body.light) {
      return NextResponse.json(
        { error: 'Invalid theme configuration' },
        { status: 400 }
      )
    }

    // Update theme settings
    const { error: updateError } = await supabase
      .from('theme_settings')
      .update({
        config: body,
        updated_at: new Date().toISOString(),
      })
      .eq('name', THEME_SETTINGS_NAME)

    if (updateError) {
      console.error('Failed to update theme:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appearance settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appearance settings updated successfully',
    })
  } catch (error) {
    console.error('Appearance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('theme_settings')
      .select('config')
      .eq('name', THEME_SETTINGS_NAME)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch appearance settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(data?.config || null)
  } catch (error) {
    console.error('Appearance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
