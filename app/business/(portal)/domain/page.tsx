/**
 * Custom Domain Settings Page
 * Manage custom domain configuration and DNS verification
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
} from '@/components/business/ui';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { DomainConfiguration } from './components/domain-configuration';
import { DNSInstructions } from './components/dns-instructions';
import { getVercelCNAMEAsync } from '@/lib/business/domain-utils';

export const metadata: Metadata = {
  title: 'Custom Domain | Business Portal',
  description: 'Configure your custom domain',
};

export default async function CustomDomainPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account with domain info
  const { data: businessUser } = await supabase
    .from('business_users')
    .select(
      `
      id,
      business_account_id,
      business_accounts (
        id,
        business_name,
        subdomain,
        custom_domain,
        custom_domain_verified,
        domain_verification_token
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccount = businessUser.business_accounts;

  // Fetch project-specific CNAME from Vercel API (cached for 1 hour)
  const cnameTarget = await getVercelCNAMEAsync();

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Custom Domain"
        description="Configure a custom domain for your booking portal"
      />

      {/* Current Setup */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Current Configuration</LuxuryCardTitle>
          <LuxuryCardDescription>Your booking portal is accessible at these URLs</LuxuryCardDescription>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-3">
          <div>
            <p className="text-sm text-[var(--business-text-muted)]">Default Subdomain</p>
            <p className="font-medium text-[var(--business-text-primary)]">
              {businessAccount.subdomain}.{process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '')}
            </p>
          </div>
          {businessAccount.custom_domain && (
            <div>
              <p className="text-sm text-[var(--business-text-muted)]">Custom Domain</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-[var(--business-text-primary)]">{businessAccount.custom_domain}</p>
                {businessAccount.custom_domain_verified ? (
                  <span className="text-xs bg-[var(--business-success)]/10 text-[var(--business-success)] px-2 py-1 rounded">
                    Verified
                  </span>
                ) : (
                  <span className="text-xs bg-[var(--business-warning)]/10 text-[var(--business-warning)] px-2 py-1 rounded">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Domain Configuration */}
      <DomainConfiguration
        businessAccountId={businessAccount.id}
        currentDomain={businessAccount.custom_domain}
        isVerified={businessAccount.custom_domain_verified}
      />

      {/* DNS Instructions */}
      {businessAccount.custom_domain && !businessAccount.custom_domain_verified && (
        <DNSInstructions
          customDomain={businessAccount.custom_domain}
          verificationToken={businessAccount.domain_verification_token}
          cnameTarget={cnameTarget}
        />
      )}
    </PageContainer>
  );
}
