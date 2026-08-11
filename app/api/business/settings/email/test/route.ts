/**
 * Send a test email over a business's own SMTP credentials.
 *
 * Two things here are load-bearing beyond the obvious:
 *
 *   1. The recipient is restricted to an address that belongs to this tenant. Without
 *      that, an authenticated owner could use this button to relay mail to arbitrary
 *      addresses through their own configured server, from a platform IP.
 *   2. The rate limit has an in-process layer and a durable one. The in-process layer
 *      resets on deploy, and a deploy is exactly what someone hammering the button would
 *      eventually trigger.
 */

import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailTestSchema } from '@/lib/business/validators';
import { checkAttempt } from '@/lib/business/rate-limit';
import { logBusinessActivity } from '@/lib/business/activity/log';
import { maskEmail } from '@/lib/business/activity/mask';
import { bustMailConfigCache, resolveMailConfig } from '@/lib/email/transport/resolve-config';
import { verifyTransport } from '@/lib/email/transport/transporter';
import { redactMailError, safeErrorSummary, toSafeSmtpError } from '@/lib/email/transport/smtp-errors';
import { sendEmailWithConfig } from '@/lib/email/utils/send-email';
import SmtpTestEmail from '@/lib/business/email/templates/smtp-test';
import { BOOKING_TIMEZONE } from '@/lib/business/utils/timezone';

export const dynamic = 'force-dynamic';

const TEST_KIND = 'business.smtp.test';
const MAX_TESTS = 5;
const WINDOW_MS = 10 * 60_000;

export const POST = requireBusinessOwner(async (request, user) => {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const validation = businessEmailTestSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0]?.message ?? 'Enter a valid email address', 400);
    }

    const recipient = validation.data.to_email;
    const admin = createAdminClient();

    // Layer 1: in-process, instant, resets on deploy.
    const limit = checkAttempt(`email-test:${user.businessAccountId}`, {
      max: MAX_TESTS,
      windowMs: WINDOW_MS,
    });

    if (!limit.allowed) {
      return apiError(
        `Too many test emails. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429
      );
    }

    // Layer 2: durable, survives a deploy and spans instances.
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await admin
      .from('business_email_log')
      .select('id', { count: 'exact', head: true })
      .eq('business_account_id', user.businessAccountId)
      .eq('kind', TEST_KIND)
      .gte('created_at', since);

    if ((count ?? 0) >= MAX_TESTS) {
      return apiError('Too many test emails in the last 10 minutes. Try again shortly.', 429);
    }

    // The recipient must belong to this tenant, or this endpoint is an open relay.
    const [{ data: members }, { data: account }] = await Promise.all([
      admin
        .from('business_users')
        .select('email')
        .eq('business_account_id', user.businessAccountId)
        .eq('is_active', true),
      admin
        .from('business_accounts')
        .select('business_email')
        .eq('id', user.businessAccountId)
        .maybeSingle(),
    ]);

    const allowed = new Set(
      [
        ...(members ?? []).map((m) => m.email),
        account?.business_email,
        user.memberEmail,
        user.businessEmail,
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase())
    );

    if (!allowed.has(recipient)) {
      return apiError('Send the test to your own account email or a team member address', 400);
    }

    // ignoreEnabled is the point of this route: an owner proves the credentials work
    // BEFORE switching sending on. Resolving normally would return the platform
    // transport precisely because sending is still off, and the test could never pass.
    // It also bypasses the circuit breaker, since a test send is how you recover from a
    // tripped one after fixing the password. This config is never cached.
    bustMailConfigCache(user.businessAccountId);
    const config = await resolveMailConfig(user.businessAccountId, { ignoreEnabled: true });

    if (config.provider !== 'business_smtp') {
      return apiError(
        'No usable SMTP configuration. Save your server details first, and check the password if you have just rotated it.',
        400
      );
    }

    const now = new Date();
    let failure: { code: string; summary: string; detail: string } | null = null;

    try {
      // verify() opens the connection and authenticates without sending, so an owner
      // sees "authentication failed" rather than a vaguer delivery error.
      await verifyTransport(config);

      const result = await sendEmailWithConfig({
        businessAccountId: user.businessAccountId,
        kind: TEST_KIND,
        to: recipient,
        subject: 'Test email from your booking portal',
        template: SmtpTestEmail,
        templateProps: {
          recipientName: user.memberName ?? 'there',
          smtpHost: config.smtp.host,
          smtpPort: config.smtp.port,
          fromEmail: config.identity.fromEmail,
          sentAt: now.toLocaleString('en-US', {
            timeZone: BOOKING_TIMEZONE,
            dateStyle: 'full',
            timeStyle: 'short',
          }),
        },
      }, config);

      if (!result.success) {
        failure = {
          code: 'send_failed',
          summary: result.error ?? 'The mail server rejected the message.',
          detail: result.error ?? '',
        };
      }
    } catch (error) {
      const safe = toSafeSmtpError(error, config);
      failure = {
        code: safe.code,
        summary: safeErrorSummary(safe),
        detail: redactMailError(error, config),
      };
    }

    const timestamp = now.toISOString();

    await admin
      .from('business_email_settings')
      .update(
        failure
          ? {
              last_test_at: timestamp,
              last_test_status: 'failure',
              last_test_error: failure.summary.slice(0, 500),
            }
          : {
              last_test_at: timestamp,
              last_test_status: 'success',
              last_test_error: null,
              last_success_at: timestamp,
              consecutive_failures: 0,
            }
      )
      .eq('business_account_id', user.businessAccountId);

    bustMailConfigCache(user.businessAccountId);

    await logBusinessActivity({
      businessAccountId: user.businessAccountId,
      action: failure ? 'settings.email_test_failed' : 'settings.email_test_sent',
      actor: {
        type: 'business_user',
        authUserId: user.userId,
        businessUserId: user.businessId,
        name: user.memberName ?? user.memberEmail ?? 'An owner',
        email: user.memberEmail,
        role: user.role,
      },
      entity: { type: 'setting', label: 'Email sending' },
      metadata: {
        // Masked: the activity log is exportable and must not become a contact list.
        // business_email_log holds the real address, behind owner-only RLS.
        to_email_masked: maskEmail(recipient),
        smtp_host: config.smtp.host,
        ...(failure ? { reason_public: failure.summary } : {}),
      },
      request,
    });

    if (failure) {
      console.error(`[business email test] ${user.businessAccountId}:`, failure.detail);
      return apiSuccess({ sent: false, error: failure.summary, code: failure.code });
    }

    return apiSuccess({ sent: true, to: recipient });
  } catch (error) {
    console.error('[business email test] unexpected error:', error);
    return apiError('Failed to send the test email', 500);
  }
});
