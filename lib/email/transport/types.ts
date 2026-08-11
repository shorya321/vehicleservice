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
 * The palette a template renders under.
 *
 * Only the business module's own templates read this. Every shared template
 * (customer, vendor, driver, auth, wallet, admin) keeps its own static styles, so
 * adding this field cannot change what a customer receives.
 *
 * Semantic colours are deliberately absent: status badges and info/success/warning
 * boxes carry meaning, and a tenant whose accent happens to be red must not end up
 * with a red "confirmed" badge.
 */
export interface EmailBrandColors {
  /** Buttons and links. */
  readonly primary: string;
  /** Label colour on top of `primary`, picked for contrast rather than configured. */
  readonly primaryText: string;
  /** The page behind the message card. */
  readonly background: string;
  /** The message card itself. */
  readonly surface: string;
  readonly heading: string;
  readonly text: string;
  /** Footer text and secondary captions. */
  readonly muted: string;
  readonly border: string;
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
  readonly colors: EmailBrandColors;
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
