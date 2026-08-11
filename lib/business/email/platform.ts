/**
 * The server-only seam between the business email module and the shared mail transport.
 *
 * The business module owns its own copies of everything a recipient sees: templates,
 * layout, button, palette. What it does not own is the transport, because that means
 * nodemailer, AES-256-GCM credential encryption and the delivery log, and a second copy
 * of encryption code that can drift from the first is the one kind of duplication worth
 * refusing.
 *
 * NEVER import this from anything that renders in a browser. It reaches nodemailer,
 * AsyncLocalStorage and lib/email/transport/crypto, which throws at module scope when
 * `window` is defined. Templates used to import their brand accessor from here, which
 * pulled all of that into the admin email preview's client bundle and broke the build.
 * Renderable code imports lib/business/email/brand.ts instead, which is isomorphic.
 *
 * Exactly two files under lib/business/email/ may import lib/email: this one, for the
 * sender, and brand.ts, for the brand. Nothing else, so a future violation shows up in
 * one of two import lists rather than spread across a dozen templates.
 */

import { getAdminEmail, getAppUrl } from '@/lib/email/config';
import { bustMailConfigCache } from '@/lib/email/transport/resolve-config';
import { sendEmail } from '@/lib/email/utils/send-email';
import type { EmailResult, SendEmailParams } from '@/lib/email/types';

export type { EmailResult };

/**
 * Re-exported so services reach them through the boundary rather than importing
 * lib/email directly.
 */
export { getAdminEmail, getAppUrl };

/**
 * Arguments to a business send.
 *
 * `businessAccountId` is narrowed to a non-null string: every email this module sends
 * belongs to a tenant. A business email with no tenant is a contradiction, and making it
 * unrepresentable is cheaper than testing for it.
 */
export type SendBusinessEmailParams = Omit<SendEmailParams, 'businessAccountId'> & {
  businessAccountId: string;
};

/**
 * Sends a business email.
 *
 * Two routings, chosen per message by the caller:
 *
 * - Passenger mail omits `forcePlatformTransport`. It goes out over the tenant's own
 *   SMTP credentials, because the passenger's counterpart is the business, not us.
 * - Owner mail sets `forcePlatformTransport: true`. It goes out over platform
 *   credentials wearing the tenant's brand, because a notification about a broken mail
 *   server cannot travel over the mail server that broke.
 *
 * Never throws, inheriting the shared sender's contract: a caller mid-booking must not
 * be turned into a failed booking by an unreachable mail server.
 */
export function sendBusinessEmail(params: SendBusinessEmailParams): Promise<EmailResult> {
  return sendEmail(params);
}

/**
 * Sends platform mail that happens to be about a business.
 *
 * A small, closed set: the welcome-pending notice, account approved, account rejected,
 * and the new-registration notice to the platform's own admins. In all four the platform
 * is the one speaking, either to someone who is not yet a tenant or to itself, so tenant
 * credentials and tenant livery would both be wrong.
 *
 * Separate from sendBusinessEmail rather than a null `businessAccountId` on it, so that
 * "this deliberately is not tenant mail" is stated at the call site instead of inferred
 * from a missing value.
 */
export function sendPlatformEmail(
  params: Omit<SendEmailParams, 'businessAccountId' | 'forcePlatformTransport'>
): Promise<EmailResult> {
  return sendEmail({ ...params, businessAccountId: null });
}

/**
 * Drops a tenant's cached mail configuration so the next email re-reads the database.
 *
 * Call after anything that changes what an email looks like or which server carries it:
 * SMTP credentials, brand name, logo, theme colours. The resolved config is cached for
 * 60 seconds, and without this an owner changes their accent, sends a test email and
 * gets the old one back, which reads as the feature being broken.
 *
 * Best effort. The cache is per-instance, so on a multi-instance deployment this reaches
 * only the instance that served the request and the TTL remains the real guarantee.
 */
export function bustBusinessMailCache(businessAccountId: string): void {
  bustMailConfigCache(businessAccountId);
}

// getBusinessBrand lives in ./brand, not here. Templates need it, templates render in
// the browser, and this module cannot.
