/**
 * Business Portal Layout
 * Layout wrapper for authenticated business pages
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * - Typography: Plus Jakarta Sans (display) + Inter (body)
 * - Colors: Deep Indigo (#6366F1) with surface depth layers
 * - Effects: Glassmorphism, glow shadows, smooth animations
 * - Theme: Dark/Light mode support
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BusinessSidebar } from './components/business-sidebar';
import { SidebarProvider } from '@/components/business/sidebar-context';
import { BusinessThemeProvider } from '@/lib/business/theme-provider';
import { BusinessPortalContent } from './components/business-portal-content';

// Import business-specific design system
import '@/app/business/globals.css';

export default async function BusinessPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business user details
  const { data: businessUser, error } = await supabase
    .from('business_users')
    .select(
      `
      id,
      role,
      business_accounts (
        business_name,
        business_email,
        contact_person_name,
        brand_name,
        logo_url,
        primary_color,
        secondary_color,
        accent_color
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (error || !businessUser) {
    redirect('/business/login');
  }

  return (
    <BusinessThemeProvider defaultTheme="dark">
      <SidebarProvider>
        <div className="min-h-screen bg-[var(--business-surface-0)]">
          {/* Sidebar */}
          <BusinessSidebar
            businessName={businessUser.business_accounts.business_name}
            brandName={businessUser.business_accounts.brand_name}
            logoUrl={businessUser.business_accounts.logo_url}
            primaryColor={businessUser.business_accounts.primary_color}
            secondaryColor={businessUser.business_accounts.secondary_color}
            accentColor={businessUser.business_accounts.accent_color}
          />

          {/* Main Content Area - with dynamic margin based on sidebar state */}
          <BusinessPortalContent
            userEmail={businessUser.business_accounts.business_email}
            contactPersonName={businessUser.business_accounts.contact_person_name}
            businessName={businessUser.business_accounts.business_name}
            brandName={businessUser.business_accounts.brand_name}
            logoUrl={businessUser.business_accounts.logo_url}
            primaryColor={businessUser.business_accounts.primary_color}
            secondaryColor={businessUser.business_accounts.secondary_color}
            accentColor={businessUser.business_accounts.accent_color}
          >
            {children}
          </BusinessPortalContent>
        </div>
      </SidebarProvider>
    </BusinessThemeProvider>
  );
}
