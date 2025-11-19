/**
 * Business Settings Page
 * Manage business account settings and profile
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileSettings } from './components/profile-settings';
import { CreditCard, Palette, Bell, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Business Portal',
  description: 'Manage your business account settings',
};

export default async function BusinessSettingsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account details
  const { data: businessUser } = await supabase
    .from('business_users')
    .select(
      `
      id,
      role,
      business_account_id,
      business_accounts (
        id,
        business_name,
        business_email,
        business_phone,
        contact_person_name,
        address,
        city,
        country_code,
        subdomain,
        status
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccount = businessUser.business_accounts;

  const settingsLinks = [
    {
      href: '/business/settings/payment',
      icon: CreditCard,
      title: 'Payment Settings',
      description: 'Manage payment methods, currency, and auto-save preferences',
    },
    {
      href: '/business/settings/branding',
      icon: Palette,
      title: 'Branding',
      description: 'Customize your business logo and brand colors',
    },
    {
      href: '/business/settings/notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Configure email and wallet notification preferences',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business account settings</p>
      </div>

      {/* Settings Navigation */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{link.title}</h3>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Read-only account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Account Status</p>
            <p className="font-medium capitalize">{businessAccount.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Role</p>
            <p className="font-medium capitalize">{businessUser.role}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subdomain</p>
            <p className="font-medium">
              {businessAccount.subdomain}.
              {process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <ProfileSettings
        businessAccountId={businessAccount.id}
        currentData={{
          business_name: businessAccount.business_name,
          business_phone: businessAccount.business_phone,
          contact_person_name: businessAccount.contact_person_name,
          address: businessAccount.address || '',
          city: businessAccount.city || '',
          country_code: businessAccount.country_code || '',
        }}
      />
    </div>
  );
}
