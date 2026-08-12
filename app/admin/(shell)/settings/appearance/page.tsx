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
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { AppearanceSettingsForm } from './components/appearance-form'

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
        <Breadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Appearance' }]} />
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appearance Settings</h1>
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
