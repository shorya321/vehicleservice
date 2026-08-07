/**
 * Maps a nodemailer/SMTP failure to something safe to show a business owner.
 *
 * Two audiences, two outputs:
 *   - the owner sees { code, message, hint } - actionable, no internals
 *   - the log row and console see the redacted raw text, which is the owner's own
 *     server talking to them and therefore theirs to read, minus credentials
 *
 * Some servers echo the submitted username, and occasionally the base64 AUTH blob,
 * back inside a 535 response, which is why nothing reaches either audience without
 * passing through redactSecrets first.
 */

import { redactSecrets } from './crypto';
import type { ResolvedMailConfig, SafeSmtpError } from './types';

const MAX_RAW_LENGTH = 1000;
const MAX_MESSAGE_LENGTH = 500;

/** Raised when a send exceeds the outer deadline. */
export class MailTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailTimeoutError';
    // Required: tsconfig targets ES5, where subclassing Error breaks instanceof.
    Object.setPrototypeOf(this, MailTimeoutError.prototype);
  }
}

interface NodemailerLikeError {
  readonly code?: unknown;
  readonly command?: unknown;
  readonly response?: unknown;
  readonly responseCode?: unknown;
  readonly message?: unknown;
}

function asNodemailerError(error: unknown): NodemailerLikeError {
  return typeof error === 'object' && error !== null ? (error as NodemailerLikeError) : {};
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Everything an SMTP error can leak that we know the value of. */
function secretsOf(config: ResolvedMailConfig): readonly string[] {
  return [config.smtp.pass, config.smtp.user];
}

/**
 * The raw server dialogue, redacted and truncated. Safe for the owner-only log table
 * and for console.error. Never returned to a client as-is.
 */
export function redactMailError(error: unknown, config: ResolvedMailConfig): string {
  const raw = asNodemailerError(error);

  const parts = [
    stringOrUndefined(raw.message),
    stringOrUndefined(raw.response),
    typeof raw.responseCode === 'number' ? `responseCode=${raw.responseCode}` : undefined,
    stringOrUndefined(raw.command) ? `command=${String(raw.command)}` : undefined,
  ].filter((part): part is string => Boolean(part));

  const combined = parts.length > 0 ? parts.join(' | ') : String(error);

  return redactSecrets(combined, secretsOf(config)).slice(0, MAX_RAW_LENGTH);
}

function hintForPreset(config: ResolvedMailConfig): string | undefined {
  const host = config.smtp.host.toLowerCase();

  if (host.includes('resend')) {
    return 'For Resend the username is literally "resend" and the password is your API key.';
  }
  if (host.includes('gmail') || host.includes('google')) {
    return 'Gmail needs a 16-character App Password, not your normal login password.';
  }
  if (host.includes('amazonaws')) {
    return 'SES needs SMTP credentials generated in the SES console, not your AWS access key id.';
  }
  if (host.includes('sendgrid')) {
    return 'For SendGrid the username is literally "apikey".';
  }

  return undefined;
}

/**
 * Owner-safe classification. The host and port are the owner's own values, so echoing
 * them back is helpful rather than a leak.
 */
export function toSafeSmtpError(error: unknown, config: ResolvedMailConfig): SafeSmtpError {
  const raw = asNodemailerError(error);
  const code = stringOrUndefined(raw.code) ?? '';
  const responseCode = typeof raw.responseCode === 'number' ? raw.responseCode : undefined;
  const message = (stringOrUndefined(raw.message) ?? '').toLowerCase();
  const where = `${config.smtp.host}:${config.smtp.port}`;

  if (error instanceof MailTimeoutError) {
    return {
      code: 'timeout',
      message: `${where} did not finish sending in time.`,
      hint: 'The server accepted the connection but stalled. Check whether it is rate limiting you.',
    };
  }

  if (code === 'EAUTH' || responseCode === 535 || responseCode === 534) {
    return {
      code: 'auth_failed',
      message: 'Authentication failed. Check the username and password.',
      hint: hintForPreset(config),
    };
  }

  if (code === 'EENVELOPE' || responseCode === 550 || responseCode === 553) {
    return {
      code: 'sender_rejected',
      message: `The server rejected the sender address ${config.identity.fromEmail}.`,
      hint: 'Verify the sending domain with your provider before using it as the from address.',
    };
  }

  // Checked before the timeout branch on purpose. nodemailer reports a refused
  // connection or an unresolvable host as ESOCKET, so matching on the code alone would
  // tell an owner their server "did not respond in time" when in fact nothing is
  // listening or the hostname is wrong. Those are different problems with different
  // fixes, so the underlying message decides.
  const refused =
    message.includes('econnrefused') ||
    message.includes('connection refused') ||
    message.includes('enotfound') ||
    message.includes('eai_again') ||
    message.includes('getaddrinfo');

  if (refused || code === 'ECONNECTION' || code === 'ECONNREFUSED' || code === 'EDNS' || code === 'ENOTFOUND') {
    return {
      code: 'connection_failed',
      message: `Could not connect to ${where}. Nothing accepted the connection.`,
      hint: 'Check the hostname and port. Common ports are 587 with STARTTLS and 465 with implicit TLS.',
    };
  }

  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || message.includes('timed out')) {
    return {
      code: 'timeout',
      message: `${where} did not respond in time.`,
      hint: 'Check the host and port, and that the server is reachable from the public internet.',
    };
  }

  if (message.includes('self-signed') || message.includes('self signed') || message.includes('certificate')) {
    return {
      code: 'tls_untrusted',
      message: 'The server presented a TLS certificate we could not verify.',
      hint: 'This usually means the hostname does not match the certificate.',
    };
  }

  if (message.includes('wrong version number') || message.includes('ssl') || message.includes('starttls')) {
    return {
      code: 'tls_mismatch',
      message: 'TLS negotiation failed.',
      hint: 'Try port 587 with STARTTLS, or port 465 with TLS on connect. The two are not interchangeable.',
    };
  }

  if (responseCode === 421 || responseCode === 450 || responseCode === 451 || responseCode === 452) {
    return {
      code: 'server_busy',
      message: 'The server temporarily refused the message.',
      hint: 'This is usually rate limiting or a full mailbox. It often succeeds on a retry.',
    };
  }

  return {
    code: code ? code.toLowerCase() : 'smtp_error',
    message: 'The mail server rejected the message.',
    hint: undefined,
  };
}

/** Convenience for the settings UI, which stores one short string. */
export function safeErrorSummary(error: SafeSmtpError): string {
  return `${error.message}${error.hint ? ` ${error.hint}` : ''}`.slice(0, MAX_MESSAGE_LENGTH);
}
