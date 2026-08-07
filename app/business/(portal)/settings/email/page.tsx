import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBusinessMember } from '@/lib/business/member-scope';
import { PageContainer, PageHeader } from '@/components/business/layout';
import { EmailSettingsContent } from './components/email-settings-content';
import type { EmailSettings, EmailLogEntry } from './components/types';

export const metadata: Metadata = {
  title: 'Email Sending',
  description: 'Send booking emails from your own domain',
};

export const dynamic = 'force-dynamic';

/**
 * Columns safe to render. smtp_password_encrypted is deliberately absent, and the
 * column-level GRANT would reject it from a session client anyway.
 */
const SAFE_COLUMNS =
  'enabled, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password_updated_at, ' +
  'from_name, from_email, reply_to, provider_preset, allow_platform_fallback, ' +
  'last_test_at, last_test_status, last_test_error, last_success_at, consecutive_failures';

export default async function BusinessEmailSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/business/login');

  const member = await getBusinessMember(supabase, user.id);
  if (!member) redirect('/business/login');
  if (member.role !== 'owner') redirect('/business/dashboard');

  // Admin client for the settings row: the owner policy would allow it, but reading
  // through the same client the API writes with keeps one code path for this table.
  const admin = createAdminClient();

  const [{ data: settingsRow }, { data: logRows }, { data: account }] = await Promise.all([
    admin
      .from('business_email_settings')
      .select(`${SAFE_COLUMNS}, smtp_password_encrypted`)
      .eq('business_account_id', member.businessAccountId)
      .maybeSingle(),
    admin
      .from('business_email_log')
      .select(
        'id, kind, to_email, from_email, subject, provider, status, smtp_host, message_id, ' +
          'error_code, error_message, duration_ms, attempt, created_at'
      )
      .eq('business_account_id', member.businessAccountId)
      .order('created_at', { ascending: false })
      .limit(25),
    admin
      .from('business_accounts')
      .select('business_email')
      .eq('id', member.businessAccountId)
      .maybeSingle(),
  ]);

  let settings: EmailSettings | null = null;

  if (settingsRow) {
    const { smtp_password_encrypted, ...safe } = settingsRow as Record<string, unknown> & {
      smtp_password_encrypted?: string;
    };

    settings = {
      ...(safe as Omit<EmailSettings, 'has_password'>),
      has_password: Boolean(smtp_password_encrypted),
    };
  }

  return (
    <PageContainer>
      <PageHeader
        title="Email Sending"
        description="Send booking emails from your own domain instead of ours"
      />
      <EmailSettingsContent
        initialSettings={settings}
        initialLogs={(logRows ?? []) as unknown as EmailLogEntry[]}
        platformFallbackFrom={process.env.RESEND_FROM_EMAIL ?? 'our default address'}
        // business_users.email is null on accounts created before the 20260720 backfill,
        // which would leave the test dialog with an empty recipient and a dead Send
        // button. The account's own address is always present and is always on the
        // test-send allow-list, so it is the right fallback.
        memberEmail={member.email ?? account?.business_email ?? ''}
      />
    </PageContainer>
  );
}
