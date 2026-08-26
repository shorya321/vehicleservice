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

/** Rows shown before the log table's first "Load more". Must match DEFAULT_LIMIT in the logs route. */
const LOG_PAGE_SIZE = 25;

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
      // created_at is not unique (timestamptz DEFAULT now(), and now() is transaction
      // start time), so the id tiebreaker has to match the one the logs route orders by,
      // or the cursor minted below can point at the wrong side of a tie. One extra row is
      // fetched to learn whether a next page exists, the same trick the route uses.
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(LOG_PAGE_SIZE + 1),
    admin
      .from('business_accounts')
      .select('business_email, custom_domain, custom_domain_verified')
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

  // The first page is delivered by this component, so the cursor for the page after it
  // has to come from here too. Without it the table opened with cursor === null, the
  // first "Load more" sent no cursor, and the route answered with the newest 25 rows a
  // second time - 25 duplicate React keys appended to the list.
  const allLogs = (logRows ?? []) as unknown as EmailLogEntry[];
  const logsHasMore = allLogs.length > LOG_PAGE_SIZE;
  const logsPage = logsHasMore ? allLogs.slice(0, LOG_PAGE_SIZE) : allLogs;
  const lastLog = logsPage[logsPage.length - 1];
  // Format is the route's own `${created_at}|${id}`. It validates the halves against
  // /^[\d:.T+-]+Z?$/ and a UUID pattern and silently drops a cursor that fails either,
  // which would put the duplicate rows straight back.
  const logsCursor = logsHasMore && lastLog ? `${lastLog.created_at}|${lastLog.id}` : null;

  return (
    <PageContainer>
      <PageHeader
        title="Email Sending"
        description="Send booking emails from your own domain instead of ours"
      />
      <EmailSettingsContent
        initialSettings={settings}
        initialLogs={logsPage}
        initialLogsCursor={logsCursor}
        initialLogsHasMore={logsHasMore}
        platformFallbackFrom={process.env.RESEND_FROM_EMAIL ?? 'our default address'}
        // business_users.email is null on accounts created before the 20260720 backfill,
        // which would leave the test dialog with an empty recipient and a dead Send
        // button. The account's own address is always present and is always on the
        // test-send allow-list, so it is the right fallback.
        memberEmail={member.email ?? account?.business_email ?? ''}
        // Only a verified domain is offered as the expected sender domain. An unverified
        // one is a claim, and warning a tenant that their sender does not match a domain
        // they have not proved they own would be noise.
        tenantDomain={
          account?.custom_domain_verified ? (account.custom_domain as string | null) : null
        }
      />
    </PageContainer>
  );
}
