/**
 * Admin Portal - Appearance Settings Page
 * Configure theme colors for admin and vendor dashboards
 *
 * SCOPE: Admin module ONLY
 * Changes here affect both admin and vendor portals
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminThemeSettings } from '@/lib/admin/theme-server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AppearanceSettingsForm } from './components/appearance-form'
import { Palette } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Appearance Settings | Admin Portal',
  description: 'Configure theme and appearance for admin and vendor dashboards',
}

export default async function AppearanceSettingsPage() {
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

  // Fetch current theme settings
  const currentTheme = await getAdminThemeSettings()

  return (
      <AnimatedPage>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Appearance Settings
              </h1>
            </div>
            <p className="text-muted-foreground">
              Customize the look and feel of admin and vendor dashboards. Changes apply to all users.
            </p>
          </div>

          {/* Settings Form */}
          <AppearanceSettingsForm currentTheme={currentTheme} />
        </div>
      </AnimatedPage>
  )
}
