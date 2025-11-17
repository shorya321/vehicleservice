/**
 * Custom Domain Settings Page
 * Manage custom domain configuration and DNS verification
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainConfiguration } from './components/domain-configuration';
import { DNSInstructions } from './components/dns-instructions';

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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Custom Domain</h1>
        <p className="text-muted-foreground">
          Configure a custom domain for your booking portal
        </p>
      </div>

      {/* Current Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>Your booking portal is accessible at these URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Default Subdomain</p>
            <p className="font-medium">
              {businessAccount.subdomain}.{process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '')}
            </p>
          </div>
          {businessAccount.custom_domain && (
            <div>
              <p className="text-sm text-muted-foreground">Custom Domain</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{businessAccount.custom_domain}</p>
                {businessAccount.custom_domain_verified ? (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                    Verified
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
        />
      )}
    </div>
  );
}
