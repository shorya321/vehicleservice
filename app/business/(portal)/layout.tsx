/**
 * Business Portal Layout
 * Layout wrapper for authenticated business pages
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * - Typography: Plus Jakarta Sans (display) + Inter (body)
 * - Colors: Deep Indigo (#6366F1) with surface depth layers
 * - Effects: Glassmorphism, glow shadows, smooth animations
 * - Theme: Dark/Light mode support via theme_config JSONB
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BusinessSidebar } from './components/business-sidebar';
import { SidebarProvider } from '@/components/business/sidebar-context';
import { BusinessThemeProvider } from '@/lib/business/theme-provider';
import { BusinessPortalContent } from './components/business-portal-content';
import { normalizeBusinessRole } from '@/lib/business/api-utils';
import { parseThemeConfig } from '@/lib/business/branding-utils';

// Import business-specific design system
import '@/app/business/globals.css';

export const dynamic = 'force-dynamic'

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

  // Get business user details with theme_config
  const { data: businessUser, error } = await supabase
    .from('business_users')
    .select(
      `
      id,
      role,
      full_name,
      email,
      business_accounts (
        business_name,
        business_email,
        contact_person_name,
        brand_name,
        logo_url,
        theme_config
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (error || !businessUser) {
    redirect('/business/login');
  }

  // Get user avatar from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name')
    .eq('id', user.id)
    .maybeSingle();

  // Extract branding for convenience
  const branding = businessUser.business_accounts as {
    business_name: string;
    business_email: string;
    contact_person_name: string | null;
    brand_name: string | null;
    logo_url: string | null;
    theme_config: unknown;
  };

  // Parse theme config with defaults
  const themeConfig = parseThemeConfig(branding.theme_config);

  // The header shows the SIGNED-IN MEMBER, not the business. Falling back to
  // contact_person_name / business_email is only correct for the owner - doing
  // it for staff showed every one of them the owner's identity as their own.
  const isOwner = normalizeBusinessRole(businessUser.role) === 'owner';
  const memberEmail = businessUser.email || user.email || branding.business_email;
  const memberName =
    businessUser.full_name ||
    profile?.full_name ||
    (isOwner ? branding.contact_person_name : null) ||
    memberEmail.split('@')[0] ||
    'User';

  return (
    <BusinessThemeProvider
      defaultTheme="dark"
      themeConfig={themeConfig}
    >
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          {/* Skip Navigation Link - Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--business-primary-500)] focus:text-white focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--business-primary-400)] focus:ring-offset-2 focus:ring-offset-[var(--business-surface-0)]"
          >
            Skip to main content
          </a>

          {/* Sidebar */}
          <BusinessSidebar
            businessName={branding.business_name}
            brandName={branding.brand_name}
            logoUrl={branding.logo_url}
            primaryColor={themeConfig.accent.primary}
            secondaryColor={themeConfig.accent.secondary}
            accentColor={themeConfig.accent.tertiary}
            role={businessUser.role}
          />

          {/* Main Content Area - with dynamic margin based on sidebar state */}
          <BusinessPortalContent
            userEmail={memberEmail}
            contactPersonName={memberName}
            role={businessUser.role}
            businessName={branding.business_name}
            brandName={branding.brand_name}
            logoUrl={branding.logo_url}
            avatarUrl={profile?.avatar_url ?? null}
            primaryColor={themeConfig.accent.primary}
            secondaryColor={themeConfig.accent.secondary}
            accentColor={themeConfig.accent.tertiary}
          >
            {children}
          </BusinessPortalContent>
        </div>
      </SidebarProvider>
    </BusinessThemeProvider>
  );
}
