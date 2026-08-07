import { jsx } from 'react/jsx-runtime';
import { render } from '@react-email/render';
import type React from 'react';
import { getResendClient, getEmailConfig } from '../config';
import { runWithBrand } from '../brand/brand-store.server';
import {
  deliver,
  formatAddress,
  getPlatformMailConfig,
  redactMailError,
  resolveMailConfig,
  toSafeSmtpError,
  type ResolvedMailConfig,
} from '../transport';
import { logEmail } from './email-log';
import { recordSendOutcome } from './send-health';
import type { EmailResult, SendEmailParams } from '../types';

/**
 * Which transport platform mail goes out on.
 *
 * Defaults to 'resend', so introducing this module changes nothing. Setting
 * MAIL_TRANSPORT=smtp switches platform mail to nodemailer. Keeping the Resend path
 * alive means a production problem with SMTP is one environment variable away from
 * being undone, with no code change and no redeploy.
 *
 * Tenant mail is unaffected by this switch: a business with its own credentials always
 * goes over SMTP, because there is no Resend equivalent for arbitrary tenant servers.
 */
function platformTransportMode(): 'resend' | 'smtp' {
  return process.env.MAIL_TRANSPORT === 'smtp' ? 'smtp' : 'resend';
}

/**
 * Renders a template under the resolved brand.
 *
 * The brand scope wraps both renders because getCurrentBrand() is read inside the
 * template tree and render() awaits internally.
 */
async function renderTemplate(
  template: React.ComponentType<any>,
  templateProps: Record<string, any>,
  config: ResolvedMailConfig
): Promise<{ html: string; text: string }> {
  const element = jsx(template, templateProps);

  return runWithBrand(config.brand, async () => ({
    html: await render(element),
    text: await render(element, { plainText: true }),
  }));
}

/**
 * Runs bookkeeping alongside a send without ever letting it affect the send.
 *
 * These calls are deliberately not awaited: an owner's booking must not wait on a log
 * write. But a bare `void promise` has no rejection handler, and an unhandled rejection
 * terminates the Node process on current runtimes. Today logEmail and recordSendOutcome
 * both swallow their own errors, so this is belt and braces, but it makes "bookkeeping
 * cannot break a send" a property of the call site rather than of their internals.
 */
function fireAndForget(start: () => Promise<unknown> | undefined, label: string): void {
  try {
    // A thunk, not a promise. Handing over an already-started promise would run the
    // bookkeeping call BEFORE entering this function, so a synchronous throw would
    // escape into the send and report a delivered email as failed. Invoking it in here
    // is what makes the guarantee real.
    const work = start();

    // Guard the shape too: if a bookkeeping function ever returns a non-promise, calling
    // .catch on it would throw for the same reason.
    if (!work || typeof work.catch !== 'function') return;

    void work.catch((error: unknown) => {
      console.error(`[send-email] ${label} failed:`, error);
    });
  } catch (error) {
    console.error(`[send-email] ${label} could not be scheduled:`, error);
  }
}

/**
 * The original Resend path, behaviour unchanged. This is the rollback route: it stays
 * until SMTP has been live and quiet for a release cycle.
 */
async function sendViaResend(params: SendEmailParams, config: ResolvedMailConfig): Promise<EmailResult> {
  const resend = getResendClient();
  const emailConfig = getEmailConfig();

  const element = jsx(params.template, params.templateProps);
  const plainText = await runWithBrand(config.brand, () => render(element, { plainText: true }));

  const { data: emailData, error } = await resend.emails.send({
    from: emailConfig.from,
    to: params.to,
    replyTo: params.replyTo || emailConfig.replyTo,
    subject: params.subject,
    react: element,
    text: plainText,
  });

  // Logged on this path too, not just the SMTP one.
  //
  // MAIL_TRANSPORT defaults to 'resend', so a business that has not configured its own
  // server sends everything through here. Without these two calls its Delivery log stays
  // permanently empty, which directly contradicts what the empty state promises: that
  // every message is recorded "whether it was delivered through your server or ours".
  const logBase = {
    config,
    kind: params.kind ?? 'email',
    to: params.to,
    subject: params.subject,
    replyTo: params.replyTo,
    relatedId: params.relatedId,
  } as const;

  if (error) {
    console.error(`Failed to send email to ${params.to}:`, error);

    fireAndForget(() => logEmail({
      ...logBase,
      status: 'failed',
      error: { code: 'resend_error', message: error.message || 'Failed to send email' },
    }), 'delivery log');

    return {
      success: false,
      error: error.message || 'Failed to send email',
      provider: 'platform_smtp',
    };
  }

  fireAndForget(() => logEmail({ ...logBase, status: 'sent', messageId: emailData?.id }), 'delivery log');

  return { success: true, emailId: emailData?.id, provider: 'platform_smtp' };
}

async function sendViaSmtp(params: SendEmailParams, config: ResolvedMailConfig): Promise<EmailResult> {
  const { html, text } = await renderTemplate(params.template, params.templateProps, config);

  const message = {
    to: params.to,
    subject: params.subject,
    html,
    text,
    replyTo: params.replyTo,
  };

  try {
    const result = await deliver({ config, ...message });

    const tenantId = config.provider === 'business_smtp' ? config.businessAccountId : null;
    if (tenantId) {
      fireAndForget(() => recordSendOutcome(tenantId, true), 'send health');
    }

    fireAndForget(() => logEmail({
      config,
      kind: params.kind ?? 'email',
      to: params.to,
      subject: params.subject,
      status: 'sent',
      replyTo: params.replyTo,
      messageId: result.messageId,
      durationMs: result.durationMs,
      relatedId: params.relatedId,
    }), 'delivery log');

    return { success: true, emailId: result.messageId, provider: result.provider };
  } catch (error) {
    const safe = toSafeSmtpError(error, config);
    const detail = redactMailError(error, config);

    console.error(`[send-email] ${config.provider} failed for ${params.to}:`, detail);

    const isTenantTransport = config.provider === 'business_smtp' && Boolean(config.businessAccountId);

    const tenantId = isTenantTransport ? config.businessAccountId : null;
    if (tenantId) {
      fireAndForget(() => recordSendOutcome(tenantId, false, safe.message), 'send health');
    }

    // One retry on platform credentials, if the tenant has not opted out.
    //
    // This necessarily changes the From header to the platform address, which is a
    // visible white-label leak. It is the lesser evil: a booking confirmation that
    // arrives from the wrong sender beats one that never arrives. The row is written
    // with status 'fell_back' so the leak is auditable rather than silent.
    if (isTenantTransport && config.allowPlatformFallback) {
      const platform: ResolvedMailConfig = {
        ...getPlatformMailConfig(),
        // Keep the tenant's brand: only the envelope falls back, not the identity the
        // recipient reads.
        businessAccountId: config.businessAccountId,
        brand: config.brand,
      };

      try {
        const retry = await deliver({ config: platform, ...message });

        fireAndForget(() => logEmail({
          config: platform,
          kind: params.kind ?? 'email',
          to: params.to,
          subject: params.subject,
          status: 'fell_back',
          replyTo: params.replyTo,
          messageId: retry.messageId,
          durationMs: retry.durationMs,
          attempt: 2,
          relatedId: params.relatedId,
          error: safe,
          errorDetail: detail,
        }), 'delivery log');

        return { success: true, emailId: retry.messageId, provider: platform.provider };
      } catch (retryError) {
        const retrySafe = toSafeSmtpError(retryError, platform);

        fireAndForget(() => logEmail({
          config: platform,
          kind: params.kind ?? 'email',
          to: params.to,
          subject: params.subject,
          status: 'failed',
          replyTo: params.replyTo,
          attempt: 2,
          relatedId: params.relatedId,
          error: retrySafe,
          errorDetail: redactMailError(retryError, platform),
        }), 'delivery log');

        return { success: false, error: retrySafe.message, provider: platform.provider };
      }
    }

    fireAndForget(() => logEmail({
      config,
      kind: params.kind ?? 'email',
      to: params.to,
      subject: params.subject,
      status: 'failed',
      replyTo: params.replyTo,
      relatedId: params.relatedId,
      error: safe,
      errorDetail: detail,
    }), 'delivery log');

    return { success: false, error: safe.message, provider: config.provider };
  }
}

/**
 * The single place an email is rendered and handed to a transport.
 *
 * Never throws. A failed send returns { success: false } so that a caller mid-booking
 * is not turned into a failed booking by an unreachable mail server.
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  return sendEmailWithConfig(params, null);
}

/**
 * Sends using a caller-supplied configuration instead of resolving one.
 *
 * Exists for the test-send route, which resolves with `ignoreEnabled` so an owner can
 * prove their credentials work *before* switching sending on. Letting it call sendEmail
 * would re-resolve and land back on the platform transport, which is the deadlock this
 * seam exists to avoid.
 *
 * @param resolved pass null to resolve normally.
 */
export async function sendEmailWithConfig(
  params: SendEmailParams,
  resolved: ResolvedMailConfig | null
): Promise<EmailResult> {
  let config: ResolvedMailConfig | null = resolved;

  try {
    config = resolved ?? (await resolveMailConfig(params.businessAccountId ?? null));

    if (config.provider === 'platform_smtp' && platformTransportMode() === 'resend') {
      return await sendViaResend(params, config);
    }

    return await sendViaSmtp(params, config);
  } catch (error) {
    if (config) {
      // redactMailError, not the raw error: some servers echo the submitted username
      // and the base64 AUTH blob back inside a 535 response.
      console.error(
        `Failed to send email to ${params.to} from ${formatAddress(config.identity.fromName, config.identity.fromEmail)}:`,
        redactMailError(error, config)
      );

      return {
        success: false,
        error: toSafeSmtpError(error, config).message,
        provider: config.provider,
      };
    }

    console.error(`Unexpected error sending email to ${params.to}:`, error);
    return { success: false, error: 'An unexpected error occurred while sending the email' };
  }
}
