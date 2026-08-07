/**
 * Guards the routing rule: which emails must NOT go out on a tenant's SMTP server.
 *
 * The rule
 * --------
 * Use tenant credentials only when the tenant is the sender-of-record. Fall back to the
 * platform when the recipient IS the platform, when the platform is speaking ABOUT the
 * tenant's account, when the tenant is not yet approved, or when the message carries an
 * authentication credential.
 *
 * This is a source-level test rather than a behavioural one on purpose. The failure it
 * catches is someone later "tidying up" a platform-only send by threading a tenant id
 * into it, which would be invisible at runtime until a real tenant complained. Reading
 * the argument out of the source pins the decision where the decision is written.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SERVICES = join(process.cwd(), 'lib/email/services');

function source(file: string): string {
  return readFileSync(join(SERVICES, file), 'utf8');
}

/** The argument object literal of a given exported function, up to its closing brace. */
function bodyOf(file: string, fn: string): string {
  const src = source(file);
  const start = src.indexOf(`export async function ${fn}`);

  if (start === -1) {
    throw new Error(`${fn} not found in ${file}. If it was renamed, update this guard rather than deleting it.`);
  }

  const next = src.indexOf('\nexport ', start + 1);
  return src.slice(start, next === -1 ? undefined : next);
}

/**
 * Sends whose recipient is the platform, or which the platform makes about a tenant's
 * account, or which carry a credential. Each entry records why.
 */
const PLATFORM_ONLY: Array<[file: string, fn: string, why: string]> = [
  [
    'business-emails.ts',
    'sendBusinessRegistrationAdminNotificationEmail',
    'recipient is a platform administrator, not the tenant audience',
  ],
  [
    'business-emails.ts',
    'sendBusinessWelcomePendingEmail',
    'account is unapproved, so nothing about it is verified yet',
  ],
  [
    'business-emails.ts',
    'sendBusinessApprovalEmail',
    'the platform is speaking about the tenant account',
  ],
  [
    'business-emails.ts',
    'sendBusinessRejectionEmail',
    'a rejection must not depend on the rejected party mail server',
  ],
  [
    'wallet-emails.ts',
    'sendWalletFrozenEmail',
    'enforcement notice must arrive even when the tenant is uncooperative',
  ],
  [
    'admin-emails.ts',
    'sendNewBookingNotificationEmail',
    'recipient is the platform admin',
  ],
  [
    'admin-emails.ts',
    'sendNewUserNotificationEmail',
    'recipient is the platform admin',
  ],
  [
    'auth-emails.ts',
    'sendPasswordResetEmail',
    'a reset link is a bearer credential and account recovery must not depend on tenant infrastructure',
  ],
  [
    'auth-emails.ts',
    'sendWelcomeEmail',
    'platform account signup',
  ],
  [
    'auth-emails.ts',
    'sendVerificationEmail',
    'platform account verification',
  ],
  [
    'vendor-emails.ts',
    'sendBookingDatetimeModifiedEmail',
    'vendors are platform suppliers and must see one consistent sender across tenants',
  ],
  [
    'vendor-emails.ts',
    'sendBookingAssignmentEmail',
    'vendors are platform suppliers',
  ],
  [
    'vendor-emails.ts',
    'sendBookingUnassignmentEmail',
    'vendors are platform suppliers',
  ],
  [
    'driver-emails.ts',
    'sendDriverBookingAssignmentEmail',
    'drivers are platform suppliers, even on a business booking',
  ],
  [
    'driver-emails.ts',
    'sendDriverBookingUnassignmentEmail',
    'drivers are platform suppliers, even on a business booking',
  ],
];

describe('platform-only sends', () => {
  it.each(PLATFORM_ONLY)('%s %s passes a null tenant, because %s', (file, fn, _why) => {
    expect(bodyOf(file, fn)).toContain('businessAccountId: null');
  });

  it.each(PLATFORM_ONLY)('%s %s never reads a tenant id from its data', (file, fn, _why) => {
    expect(bodyOf(file, fn)).not.toContain('businessAccountId: data.businessAccountId');
  });
});

/**
 * The mirror image: sends that carry the tenant, so a white-label customer sees the
 * business they booked with. Forgetting one of these is the original bug.
 */
const TENANT_SCOPED: Array<[file: string, fn: string]> = [
  ['business-emails.ts', 'sendBusinessBookingConfirmationEmail'],
  ['business-emails.ts', 'sendBusinessBookingCancellationEmail'],
  ['business-emails.ts', 'sendBusinessCustomerBookingConfirmationEmail'],
  ['business-emails.ts', 'sendBusinessCustomerDatetimeChangedEmail'],
  ['business-emails.ts', 'sendBusinessCustomerBookingCancelledEmail'],
  ['business-emails.ts', 'sendBusinessCustomerDriverAssignedEmail'],
  ['business-emails.ts', 'sendBusinessDriverAssignedEmail'],
  ['business-emails.ts', 'sendBusinessBookingStatusUpdateEmail'],
  ['wallet-emails.ts', 'sendLowBalanceAlert'],
  ['wallet-emails.ts', 'sendTransactionCompletedEmail'],
  ['wallet-emails.ts', 'sendSpendingLimitReachedEmail'],
  ['wallet-emails.ts', 'sendMonthlyStatementEmail'],
];

describe('tenant-scoped sends', () => {
  it.each(TENANT_SCOPED)('%s %s routes through the tenant', (file, fn) => {
    const body = bodyOf(file, fn);

    expect(body).toMatch(/businessAccountId: (data\.businessAccountId|businessAccountId \?\? null)/);
    expect(body).not.toContain('businessAccountId: null');
  });
});

describe('the two lists together', () => {
  it('cover every send in the business and wallet services', () => {
    const named = new Set([...PLATFORM_ONLY, ...TENANT_SCOPED].map(([file, fn]) => `${file}:${fn}`));

    for (const file of ['business-emails.ts', 'wallet-emails.ts']) {
      const exported = Array.from(source(file).matchAll(/export async function (\w+)/g)).map((m) => m[1]);

      for (const fn of exported) {
        expect(named.has(`${file}:${fn}`)).toBe(true);
      }
    }
  });
});
