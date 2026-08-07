/**
 * Tracks whether a tenant's own SMTP server is actually working.
 *
 * Feeds two things: the "your SMTP is failing" banner in business settings, and the
 * circuit breaker in resolve-config that stops attempting a broken tenant transport
 * after three consecutive failures.
 *
 * Best effort, like the delivery log. Never throws, never awaited by the sender.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { bustMailConfigCache } from '../transport/resolve-config';

/**
 * Records the outcome of a send that used a tenant's own credentials.
 *
 * @param businessAccountId the tenant whose transport was used
 * @param succeeded whether the message left on that transport
 * @param errorSummary owner-safe text, already redacted, stored for the settings banner
 */
export async function recordSendOutcome(
  businessAccountId: string,
  succeeded: boolean,
  errorSummary?: string
): Promise<void> {
  try {
    const admin = createAdminClient();

    if (succeeded) {
      const { error } = await admin
        .from('business_email_settings')
        .update({
          consecutive_failures: 0,
          last_success_at: new Date().toISOString(),
          last_test_error: null,
        })
        .eq('business_account_id', businessAccountId)
        .gt('consecutive_failures', 0);

      if (error) console.error('[send-health] reset failed:', error.message);
      return;
    }

    // Read-then-write rather than an atomic increment: there is no RPC for this and the
    // exact count does not need to be precise, only monotonic enough to trip the
    // breaker. A lost update under concurrency delays the breaker by one send.
    const { data, error: readError } = await admin
      .from('business_email_settings')
      .select('consecutive_failures')
      .eq('business_account_id', businessAccountId)
      .maybeSingle();

    if (readError || !data) {
      if (readError) console.error('[send-health] read failed:', readError.message);
      return;
    }

    const { error } = await admin
      .from('business_email_settings')
      .update({
        consecutive_failures: data.consecutive_failures + 1,
        last_test_status: 'failure',
        last_test_error: errorSummary?.slice(0, 500) ?? null,
      })
      .eq('business_account_id', businessAccountId);

    if (error) {
      console.error('[send-health] increment failed:', error.message);
      return;
    }

    // The breaker reads consecutive_failures out of the cached config, so the new count
    // has to be visible to the next send rather than up to a TTL later.
    bustMailConfigCache(businessAccountId);
  } catch (error) {
    console.error('[send-health] unexpected failure:', error);
  }
}
