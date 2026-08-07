/**
 * The platform's own mail configuration.
 *
 * Defaults to Resend over SMTP (smtp.resend.com:587, username literally "resend",
 * password = the Resend API key), so switching MAIL_TRANSPORT to 'smtp' needs no new
 * infrastructure and no new secret.
 */

import { createHash } from 'crypto';
import { getPlatformBrand } from '../brand/brand';
import type { ResolvedMailConfig } from './types';

const DEFAULT_HOST = 'smtp.resend.com';
const DEFAULT_PORT = 587;
const DEFAULT_USER = 'resend';

function readPort(): number {
  const raw = process.env.PLATFORM_SMTP_PORT;
  if (!raw) return DEFAULT_PORT;

  const port = Number(raw);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}

/**
 * Builds the platform config from the environment.
 *
 * Unlike the getEmailConfig() it replaces, this never throws on a missing
 * RESEND_FROM_EMAIL. It returns a config with an empty fromEmail and lets the send
 * fail with a structured, logged error instead. That matters because
 * app/api/business/bookings/route.ts currently needs a defensive try/catch around its
 * admin notification precisely because the old helper could throw *after* the wallet
 * had already been debited.
 */
export function getPlatformMailConfig(): ResolvedMailConfig {
  const host = process.env.PLATFORM_SMTP_HOST ?? DEFAULT_HOST;
  const port = readPort();
  const secure = (process.env.PLATFORM_SMTP_SECURE ?? 'false') === 'true';
  const user = process.env.PLATFORM_SMTP_USER ?? DEFAULT_USER;
  const pass = process.env.PLATFORM_SMTP_PASS ?? process.env.RESEND_API_KEY ?? '';

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? '';
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL || null;

  const brand = getPlatformBrand();

  // Hashes only non-secret fields. A redeploy that rotates PLATFORM_SMTP_PASS while
  // leaving host and user alone would reuse a cached transporter within an already
  // warm instance, which is fine: a redeploy creates new instances anyway.
  const fingerprint = `platform:${createHash('sha256')
    .update(`${host}|${port}|${secure}|${user}|${fromEmail}`)
    .digest('hex')
    .slice(0, 16)}`;

  return {
    provider: 'platform_smtp',
    businessAccountId: null,
    smtp: { host, port, secure, user, pass },
    identity: { fromEmail, fromName: brand.name, replyTo },
    brand,
    fingerprint,
    allowPlatformFallback: false,
  };
}

/** Whether the platform transport has enough configuration to attempt a send. */
export function isPlatformMailConfigured(): boolean {
  const config = getPlatformMailConfig();
  return Boolean(config.smtp.host && config.smtp.pass && config.identity.fromEmail);
}
