/**
 * Shared types for the mail transport layer.
 *
 * Kept free of any node-only import so this module can be pulled in from
 * anywhere, including the client bundle that renders email templates for the
 * admin preview page.
 */

/** Which credentials a message physically went out on. */
export type MailProvider = 'business_smtp' | 'platform_smtp';

/** How a message was delivered, recorded on every log row. */
export type MailDeliveryStatus = 'sent' | 'failed' | 'fell_back';

export interface SmtpTransportConfig {
  readonly host: string;
  readonly port: number;
  /** true = implicit TLS on connect (465). false = plaintext connect then STARTTLS (587/25/2525). */
  readonly secure: boolean;
  readonly user: string;
  /** Decrypted. In memory only - never logged, never serialised, never returned by an API. */
  readonly pass: string;
}

export interface MailIdentity {
  readonly fromEmail: string;
  readonly fromName: string;
  readonly replyTo: string | null;
}

/**
 * The brand a template renders under. Resolved per tenant, so a white-label
 * business's customers never see the platform's name.
 */
export interface EmailBrand {
  readonly name: string;
  readonly address: string;
  readonly url: string;
  readonly logoUrl: string | null;
  readonly supportEmail: string | null;
  /**
   * Platform legal footer links (/privacy, /terms, /contact). False for tenants:
   * those are the platform's pages, and showing them under someone else's brand
   * tells the recipient the tenant's terms are the platform's.
   */
  readonly showPlatformLinks: boolean;
}

export interface ResolvedMailConfig {
  readonly provider: MailProvider;
  readonly businessAccountId: string | null;
  readonly smtp: SmtpTransportConfig;
  readonly identity: MailIdentity;
  readonly brand: EmailBrand;
  /**
   * Transporter cache key. For a tenant this is `${businessAccountId}:${updated_at}`,
   * so editing credentials yields a new key and the stale transporter is simply
   * orphaned rather than needing explicit invalidation.
   */
  readonly fingerprint: string;
  /**
   * Whether a hard SMTP failure may be retried on the platform transport. Doing so
   * changes the From header to the platform address, which is a visible white-label
   * leak, so it is the tenant's choice.
   */
  readonly allowPlatformFallback: boolean;
}

/** Owner-safe view of an SMTP failure. Never carries credentials or raw server output. */
export interface SafeSmtpError {
  readonly code: string;
  readonly message: string;
  readonly hint?: string;
}
