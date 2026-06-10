import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/site-settings/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { GeneralSettingsForm } from './components/general-settings-form'

export const metadata: Metadata = {
  title: 'General Settings | Admin Portal',
  description: 'Configure site identity, contact details, social links, and logos',
}

export default async function GeneralSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized')
  }

  const currentSettings = await getSiteSettings()

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'General' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
          <p className="text-muted-foreground">
            Configure site identity, logos, contact details, and social media links.
          </p>
        </div>

        <GeneralSettingsForm currentSettings={currentSettings} />
      </div>
    </AnimatedPage>
  )
}
