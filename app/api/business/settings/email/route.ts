/**
 * Business Email (SMTP) Settings API
 *
 * Owner-only control over the mail server a business sends from.
 *
 * The password is written here and never read back out. GET returns has_password and
 * when it last changed; there is no endpoint anywhere that returns the plaintext or the
 * ciphertext.
 */

import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailSettingsSchema, PRIVATE_HOST_PATTERN } from '@/lib/business/validators';
import { encryptSecret, isMailCryptoConfigured } from '@/lib/email/transport/crypto';
import { bustMailConfigCache } from '@/lib/email/transport/resolve-config';
import { logBusinessActivity } from '@/lib/business/activity/log';

export const dynamic = 'force-dynamic';

/** Columns safe to hand to a browser. Never includes smtp_password_encrypted. */
const SAFE_COLUMNS =
  'enabled, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password_updated_at, ' +
  'from_name, from_email, reply_to, provider_preset, allow_platform_fallback, ' +
  'last_test_at, last_test_status, last_test_error, last_success_at, consecutive_failures, ' +
  'created_at, updated_at';

/** Failures the tenant is told the platform is currently sending on their behalf. */
function platformFallbackFrom(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'the platform default address';
}

/**
 * GET /api/business/settings/email
 */
export const GET = requireBusinessOwner(async (_request, user) => {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('business_email_settings')
      .select(`${SAFE_COLUMNS}, smtp_password_encrypted`)
      .eq('business_account_id', user.businessAccountId)
      .maybeSingle();

    if (error) {
      console.error('[business email settings] read failed:', error.message);
      return apiError('Failed to load email settings', 500);
    }

    if (!data) {
      return apiSuccess({
        settings: null,
        platform_fallback_from: platformFallbackFrom(),
        crypto_available: isMailCryptoConfigured(),
      });
    }

    const { smtp_password_encrypted, ...safe } = data as Record<string, unknown> & {
      smtp_password_encrypted?: string;
    };

    return apiSuccess({
      settings: {
        ...safe,
        // Never the value, only whether one exists.
        has_password: Boolean(smtp_password_encrypted),
      },
      platform_fallback_from: platformFallbackFrom(),
      crypto_available: isMailCryptoConfigured(),
    });
  } catch (error) {
    console.error('[business email settings] unexpected read error:', error);
    return apiError('Failed to load email settings', 500);
  }
});

/**
 * PATCH /api/business/settings/email
 */
export const PATCH = requireBusinessOwner(async (request, user) => {
  try {
    // Refuse to store a credential that cannot be read back later. Failing loudly here
    // is much better than saving something the sender will silently fall back from.
    if (!isMailCryptoConfigured()) {
      console.error('[business email settings] EMAIL_ENCRYPTION_KEY is not configured');
      return apiError('Email settings are temporarily unavailable. Contact support.', 503);
    }

    const body: unknown = await request.json();
    const validation = businessEmailSettingsSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0]?.message ?? 'Invalid email settings', 400);
    }

    const input = validation.data;

    if (process.env.NODE_ENV === 'production' && PRIVATE_HOST_PATTERN.test(input.smtp_host)) {
      return apiError('That host is not reachable from the internet. Enter your provider SMTP server.', 400);
    }

    // Sending as the platform's own domain from a tenant's server would let one tenant
    // impersonate the platform to its own customers.
    const platformDomain = platformFallbackFrom().split('@')[1]?.toLowerCase();
    if (platformDomain && input.from_email.endsWith(`@${platformDomain}`)) {
      return apiError(`The sender address cannot be on ${platformDomain}. Use your own domain.`, 400);
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('business_email_settings')
      .select('business_account_id, smtp_password_encrypted, last_test_status, enabled')
      .eq('business_account_id', user.businessAccountId)
      .maybeSingle();

    if (!existing && !input.smtp_password) {
      return apiError('A password is required the first time you save these settings', 400);
    }

    // Switching sending on without a successful test is how a tenant silently stops
    // receiving its own booking confirmations.
    const rotatingPassword = Boolean(input.smtp_password);
    if (input.enabled && (rotatingPassword || existing?.last_test_status !== 'success')) {
      return apiError('Send a test email successfully before switching this on', 409);
    }

    const passwordCiphertext = input.smtp_password
      ? encryptSecret(input.smtp_password, user.businessAccountId)
      : (existing?.smtp_password_encrypted as string);

    const now = new Date().toISOString();

    const { error } = await admin.from('business_email_settings').upsert(
      {
        business_account_id: user.businessAccountId,
        enabled: input.enabled,
        provider_preset: input.provider_preset,
        smtp_host: input.smtp_host,
        smtp_port: input.smtp_port,
        smtp_secure: input.smtp_secure,
        smtp_username: input.smtp_username,
        smtp_password_encrypted: passwordCiphertext,
        smtp_password_updated_at: rotatingPassword ? now : undefined,
        from_name: input.from_name,
        from_email: input.from_email,
        reply_to: input.reply_to,
        allow_platform_fallback: input.allow_platform_fallback,
        // A new password has not been proven yet, so the health signals reset with it.
        ...(rotatingPassword
          ? { last_test_status: null, last_test_error: null, consecutive_failures: 0 }
          : {}),
        updated_at: now,
      },
      { onConflict: 'business_account_id' }
    );

    if (error) {
      console.error('[business email settings] write failed:', error.message);
      return apiError('Failed to save email settings', 500);
    }

    bustMailConfigCache(user.businessAccountId);

    // Logged from the route rather than a database trigger: the trigger would see
    // auth.uid() as NULL because the write uses the service-role client, and it could not
    // tell a password rotation from an ordinary edit.
    await logBusinessActivity({
      businessAccountId: user.businessAccountId,
      action: existing ? 'settings.email_smtp_updated' : 'settings.email_smtp_configured',
      actor: {
        type: 'business_user',
        authUserId: user.userId,
        businessUserId: user.businessId,
        name: user.memberName ?? user.memberEmail ?? 'An owner',
        email: user.memberEmail,
        role: user.role,
      },
      entity: { type: 'setting', label: 'Email sending' },
      // The host and sender are the owner's own values. The password never appears here,
      // only the fact that it changed.
      metadata: {
        smtp_host: input.smtp_host,
        smtp_port: input.smtp_port,
        from_email: input.from_email,
        // Named to avoid the word "password": the redactor in activity/log.ts matches on
        // key name, so `password_rotated: true` was being stored as the literal string
        // "[redacted]", which reads as though a secret had been passed and hidden.
        // Nothing sensitive was ever here, only a boolean.
        credential_replaced: rotatingPassword,
        enabled: input.enabled,
      },
      request,
    });

    if (rotatingPassword) {
      await logBusinessActivity({
        businessAccountId: user.businessAccountId,
        action: 'settings.email_password_rotated',
        actor: {
          type: 'business_user',
          authUserId: user.userId,
          businessUserId: user.businessId,
          name: user.memberName ?? user.memberEmail ?? 'An owner',
          email: user.memberEmail,
          role: user.role,
        },
        entity: { type: 'setting', label: 'Email sending' },
        request,
      });
    }

    if (existing && existing.enabled !== input.enabled) {
      await logBusinessActivity({
        businessAccountId: user.businessAccountId,
        action: input.enabled ? 'settings.email_smtp_enabled' : 'settings.email_smtp_disabled',
        actor: {
          type: 'business_user',
          authUserId: user.userId,
          businessUserId: user.businessId,
          name: user.memberName ?? user.memberEmail ?? 'An owner',
          email: user.memberEmail,
          role: user.role,
        },
        entity: { type: 'setting', label: 'Email sending' },
        request,
      });
    }

    return apiSuccess({ saved: true });
  } catch (error) {
    // Caught here rather than left to withErrorHandling, which returns error.message and
    // would leak SMTP or crypto internals to the browser.
    console.error('[business email settings] unexpected write error:', error);
    return apiError('Failed to save email settings', 500);
  }
});

/**
 * DELETE /api/business/settings/email
 *
 * Reverts the tenant to platform sending.
 */
export const DELETE = requireBusinessOwner(async (request, user) => {
  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from('business_email_settings')
      .delete()
      .eq('business_account_id', user.businessAccountId);

    if (error) {
      console.error('[business email settings] delete failed:', error.message);
      return apiError('Failed to remove email settings', 500);
    }

    bustMailConfigCache(user.businessAccountId);

    await logBusinessActivity({
      businessAccountId: user.businessAccountId,
      action: 'settings.email_smtp_removed',
      actor: {
        type: 'business_user',
        authUserId: user.userId,
        businessUserId: user.businessId,
        name: user.memberName ?? user.memberEmail ?? 'An owner',
        email: user.memberEmail,
        role: user.role,
      },
      entity: { type: 'setting', label: 'Email sending' },
      request,
    });

    return apiSuccess({
      removed: true,
      message: `Your emails will now send from ${platformFallbackFrom()}.`,
    });
  } catch (error) {
    console.error('[business email settings] unexpected delete error:', error);
    return apiError('Failed to remove email settings', 500);
  }
});
