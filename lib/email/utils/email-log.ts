/**
 * Records one delivery attempt in business_email_log.
 *
 * Best effort by design. Every caller invokes this without awaiting it, and it swallows
 * its own errors, because a logging failure must never turn a delivered email into a
 * reported failure, and must never abort the booking that triggered the send.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { MailDeliveryStatus, ResolvedMailConfig, SafeSmtpError } from '../transport/types';

export interface EmailLogEntry {
  readonly config: ResolvedMailConfig;
  readonly kind: string;
  readonly to: string;
  readonly subject: string;
  readonly status: MailDeliveryStatus;
  readonly replyTo?: string | null;
  readonly messageId?: string;
  /** Already redacted by redactMailError before it reaches here. */
  readonly error?: SafeSmtpError;
  readonly errorDetail?: string;
  readonly durationMs?: number;
  readonly attempt?: number;
  readonly relatedId?: string;
}

const MAX_ERROR_MESSAGE = 1000;
const MAX_SUBJECT = 500;

export async function logEmail(entry: EmailLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();

    // The owner-facing message and the raw server dialogue, combined but bounded. Both
    // have already been through redactSecrets, so no credential can reach this column.
    const errorMessage = [entry.error?.message, entry.errorDetail]
      .filter(Boolean)
      .join(' | ')
      .slice(0, MAX_ERROR_MESSAGE);

    const { error } = await admin.from('business_email_log').insert({
      business_account_id: entry.config.businessAccountId,
      kind: entry.kind,
      to_email: entry.to,
      from_email: entry.config.identity.fromEmail,
      reply_to: entry.replyTo ?? entry.config.identity.replyTo,
      subject: entry.subject.slice(0, MAX_SUBJECT),
      provider: entry.config.provider,
      status: entry.status,
      smtp_host: entry.config.smtp.host,
      message_id: entry.messageId ?? null,
      error_code: entry.error?.code ?? null,
      error_message: errorMessage || null,
      duration_ms: entry.durationMs ?? null,
      attempt: entry.attempt ?? 1,
      related_id: entry.relatedId ?? null,
    });

    if (error) {
      console.error('[email-log] insert failed:', error.message);
    }
  } catch (error) {
    console.error('[email-log] unexpected failure:', error);
  }
}
