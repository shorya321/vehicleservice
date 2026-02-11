/**
 * Admin Settings Hub Page
 * Central settings navigation with cards linking to sub-sections
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Bell, Shield, Settings2, ChevronRight, Coins } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings | Admin Portal',
  description: 'Configure admin portal settings',
}

const settingsCards = [
  {
    title: 'Appearance',
    description: 'Customize theme colors and display mode for admin and vendor dashboards',
    href: '/admin/settings/appearance',
    icon: Palette,
  },
  {
    title: 'Currencies',
    description: 'Configure enabled currencies, default currency, and exchange rates',
    href: '/admin/settings/currencies',
    icon: Coins,
  },
  {
    title: 'Notifications',
    description: 'Configure notification preferences and alert settings',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    title: 'Security',
    description: 'Manage security settings and access controls',
    href: '/admin/security',
    icon: Shield,
  },
]

export default async function SettingsPage() {
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

  return (
      <AnimatedPage>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Settings
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage your admin portal preferences and configurations
            </p>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <card.icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </AnimatedPage>
  )
}
