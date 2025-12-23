/**
 * Branding Settings Page
 * Configure white-label branding for custom business domains
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  LuxuryCard,
  LuxuryCardContent,
  LuxuryCardDescription,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryAlert,
} from '@/components/business/ui';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { Info } from 'lucide-react';
import { BrandingForm } from './components/branding-form';
import { parseThemeConfig } from '@/lib/business/branding-utils';

export const metadata: Metadata = {
  title: 'Branding Settings | Business Portal',
  description: 'Configure your white-label branding and visual identity',
};

export default async function BrandingSettingsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account with theme_config
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
        brand_name,
        logo_url,
        theme_config,
        custom_domain,
        custom_domain_verified,
        custom_domain_verified_at
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccount = businessUser.business_accounts as {
    id: string;
    business_name: string;
    brand_name: string | null;
    logo_url: string | null;
    theme_config: unknown;
    custom_domain: string | null;
    custom_domain_verified: boolean | null;
    custom_domain_verified_at: string | null;
  };

  // Parse theme config with defaults
  const themeConfig = parseThemeConfig(businessAccount.theme_config);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="White-Label Branding"
        description="Customize your brand identity for custom domain white-labeling"
      />

      {/* Information Alert */}
      <LuxuryAlert variant="info">
        <Info className="h-4 w-4" />
        <span>
          These branding settings will be applied when customers access your platform through your
          custom domain. Set up your custom domain first to see your branding in action.
        </span>
      </LuxuryAlert>

      {/* Custom Domain Status */}
      {businessAccount.custom_domain && (
        <LuxuryCard>
          <LuxuryCardHeader>
            <LuxuryCardTitle>Custom Domain</LuxuryCardTitle>
            <LuxuryCardDescription>Your white-label domain configuration</LuxuryCardDescription>
          </LuxuryCardHeader>
          <LuxuryCardContent className="space-y-3">
            <div>
              <p className="text-sm text-[var(--business-text-muted)]">Domain</p>
              <p className="font-medium text-[var(--business-text-primary)]">{businessAccount.custom_domain}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--business-text-muted)]">Status</p>
              <p
                className={`font-medium ${
                  businessAccount.custom_domain_verified ? 'text-[var(--business-success)]' : 'text-[var(--business-warning)]'
                }`}
              >
                {businessAccount.custom_domain_verified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
            {businessAccount.custom_domain_verified && (
              <div className="pt-2 text-sm text-[var(--business-success)] flex items-center gap-2">
                <Info className="h-4 w-4" />
                Your branding will be visible at https://{businessAccount.custom_domain}
              </div>
            )}
          </LuxuryCardContent>
        </LuxuryCard>
      )}

      {/* Branding Configuration Form */}
      <BrandingForm
        businessAccountId={businessAccount.id}
        currentBranding={{
          brand_name: businessAccount.brand_name || businessAccount.business_name,
          logo_url: businessAccount.logo_url,
          theme_config: themeConfig,
        }}
      />

      {/* Preview Notice */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Testing Your Branding</LuxuryCardTitle>
          <LuxuryCardDescription>How to preview your white-label configuration</LuxuryCardDescription>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-2 text-sm">
          <p className="text-[var(--business-text-primary)]">Once your custom domain is verified, you can test your branding by:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2 text-[var(--business-text-secondary)]">
            <li>Opening your custom domain in a browser</li>
            <li>Verifying your logo appears correctly</li>
            <li>Checking that brand colors are applied throughout the interface</li>
            <li>Confirming the brand name is displayed in the header and title</li>
          </ol>
          <p className="text-[var(--business-text-muted)] pt-2">
            Note: Changes may take up to 5 minutes to propagate across all pages.
          </p>
        </LuxuryCardContent>
      </LuxuryCard>
    </PageContainer>
  );
}
