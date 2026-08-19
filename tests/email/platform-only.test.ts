/**
 * Guards the routing rule: which credentials each email goes out on, and whose brand it
 * wears.
 *
 * The rule has three cases, not two.
 *
 *   Passenger mail    sendBusinessEmail, no flag.
 *                     Tenant credentials, tenant brand. The passenger's counterpart is
 *                     the business, never the platform.
 *
 *   Owner mail        sendBusinessEmail with forcePlatformTransport.
 *                     Platform credentials, tenant brand. A notification about a broken
 *                     mail server cannot travel over the mail server that broke.
 *
 *   Platform mail     sendPlatformEmail, or businessAccountId: null in shared services.
 *                     Platform credentials, platform brand. The platform is speaking to
 *                     itself, to a supplier, to someone who is not yet a tenant, or is
 *                     carrying a credential.
 *
 * A source-level test rather than a behavioural one, on purpose. The failure it catches
 * is someone later "tidying up" a routing decision, which would be invisible at runtime
 * until a real tenant complained. Reading the call out of the source pins the decision
 * where the decision is written.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SHARED_SERVICES = join(process.cwd(), 'lib/email/services');
const BUSINESS_SERVICES = join(process.cwd(), 'lib/business/email/services');

/** Business email moved into the business module; shared services stayed put. */
function source(file: string): string {
  const root = file === 'business-emails.ts' ? BUSINESS_SERVICES : SHARED_SERVICES;
  return readFileSync(join(root, file), 'utf8');
}

/** One exported function's body, up to the next export. */
function bodyOf(file: string, fn: string): string {
  const src = source(file);
  const start = src.indexOf(`export async function ${fn}`);

  if (start === -1) {
    throw new Error(
      `${fn} not found in ${file}. If it was renamed, update this guard rather than deleting it.`
    );
  }

  const next = src.indexOf('\nexport ', start + 1);
  return src.slice(start, next === -1 ? undefined : next);
}

/**
 * Platform credentials and platform brand. Each entry records why it is not tenant mail.
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
  ['business-emails.ts', 'sendBusinessApprovalEmail', 'the platform is speaking about the tenant account'],
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
  ['admin-emails.ts', 'sendNewBookingNotificationEmail', 'recipient is the platform admin'],
  ['admin-emails.ts', 'sendNewUserNotificationEmail', 'recipient is the platform admin'],
  [
    'admin-emails.ts',
    'sendNewVendorApplicationNotificationEmail',
    'recipient is the platform admin',
  ],
  [
    'auth-emails.ts',
    'sendPasswordResetEmail',
    'a reset link is a bearer credential and account recovery must not depend on tenant infrastructure',
  ],
  ['auth-emails.ts', 'sendWelcomeEmail', 'platform account signup'],
  ['auth-emails.ts', 'sendVerificationEmail', 'platform account verification'],
  [
    'vendor-emails.ts',
    'sendBookingDatetimeModifiedEmail',
    'vendors are platform suppliers and must see one consistent sender across tenants',
  ],
  ['vendor-emails.ts', 'sendBookingAssignmentEmail', 'vendors are platform suppliers'],
  ['vendor-emails.ts', 'sendBookingUnassignmentEmail', 'vendors are platform suppliers'],
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
  it.each(PLATFORM_ONLY)('%s %s stays on the platform, because %s', (file, fn, _why) => {
    const body = bodyOf(file, fn);

    // The business module states it by calling sendPlatformEmail; shared services still
    // pass an explicit null.
    expect(body).toMatch(/sendPlatformEmail\(\{|businessAccountId: null/);
  });

  it.each(PLATFORM_ONLY)('%s %s never reads a tenant id from its data', (file, fn, _why) => {
    expect(bodyOf(file, fn)).not.toContain('businessAccountId: data.businessAccountId');
  });

  it.each(PLATFORM_ONLY)('%s %s does not wear a tenant brand', (file, fn, _why) => {
    expect(bodyOf(file, fn)).not.toContain('forcePlatformTransport');
  });
});

/**
 * Tenant credentials, tenant brand. Forgetting one of these is the original bug: a
 * white-label customer receiving mail from a platform they have never heard of.
 */
const PASSENGER_SCOPED: Array<[file: string, fn: string]> = [
  ['business-emails.ts', 'sendBusinessCustomerBookingConfirmationEmail'],
  ['business-emails.ts', 'sendBusinessCustomerDatetimeChangedEmail'],
  ['business-emails.ts', 'sendBusinessCustomerBookingCancelledEmail'],
  ['business-emails.ts', 'sendBusinessCustomerDriverAssignedEmail'],
  ['business-emails.ts', 'sendBusinessCustomerBookingStatusUpdateEmail'],
  ['business-emails.ts', 'sendBusinessCustomerBookingCompletedEmail'],
  ['wallet-emails.ts', 'sendLowBalanceAlert'],
  ['wallet-emails.ts', 'sendTransactionCompletedEmail'],
  ['wallet-emails.ts', 'sendSpendingLimitReachedEmail'],
  ['wallet-emails.ts', 'sendMonthlyStatementEmail'],
];

describe('tenant-transport sends', () => {
  it.each(PASSENGER_SCOPED)('%s %s goes out on the tenant server', (file, fn) => {
    const body = bodyOf(file, fn);

    expect(body).toMatch(/businessAccountId: (data\.businessAccountId|businessAccountId \?\? null)/);
    expect(body).not.toContain('businessAccountId: null');
    expect(body).not.toContain('forcePlatformTransport');
  });
});

/**
 * Platform credentials, tenant brand.
 *
 * These are addressed to somebody on the business side rather than to their customer.
 * Routing them over the tenant's own server would mean a business whose SMTP has failed
 * stops hearing about its own bookings, with the broken server as the only thing that
 * could report it.
 *
 * Two audiences sit on this list. The owner, at business_accounts.business_email, and the
 * staff member who created the booking, at their own address. The staff member is inside
 * the tenant rather than an audience of it, so the same reasoning applies to both - and
 * splitting the two halves of one message across two servers would make delivery
 * arbitrary, with one copy arriving and one not.
 */
const BUSINESS_SIDE_SCOPED: Array<[file: string, fn: string]> = [
  ['business-emails.ts', 'sendBusinessBookingConfirmationEmail'],
  ['business-emails.ts', 'sendBusinessBookingCancellationEmail'],
  ['business-emails.ts', 'sendBusinessDriverAssignedEmail'],
  ['business-emails.ts', 'sendBusinessBookingStatusUpdateEmail'],
  ['business-emails.ts', 'sendBusinessVendorAssignedEmail'],
  ['business-emails.ts', 'sendBusinessVendorRejectedEmail'],
  ['business-emails.ts', 'sendBusinessBookingDatetimeChangedEmail'],
  ['business-emails.ts', 'sendBusinessCreatorBookingConfirmationEmail'],
  ['business-emails.ts', 'sendBusinessCreatorBookingCancellationEmail'],
  ['business-emails.ts', 'sendBusinessCreatorBookingStatusUpdateEmail'],
  ['business-emails.ts', 'sendBusinessCreatorDriverAssignedEmail'],
  ['business-emails.ts', 'sendBusinessCreatorVendorRejectedEmail'],
  ['business-emails.ts', 'sendBusinessCreatorDatetimeChangedEmail'],
];

describe('business-side sends', () => {
  it.each(BUSINESS_SIDE_SCOPED)('%s %s uses platform transport', (file, fn) => {
    expect(bodyOf(file, fn)).toContain('forcePlatformTransport: true');
  });

  it.each(BUSINESS_SIDE_SCOPED)(
    '%s %s still carries the tenant, so the brand survives',
    (file, fn) => {
      const body = bodyOf(file, fn);

      expect(body).toContain('businessAccountId: data.businessAccountId');
      expect(body).not.toContain('businessAccountId: null');
    }
  );
});

/**
 * The staff copies must not carry the tenant's running wallet balance.
 *
 * The templates enforce this through a discriminated union, but only because each sender
 * annotates its templateProps: SendEmailParams types that field as Record<string, any>,
 * so an unannotated literal is unchecked and the union enforces nothing. This pins the
 * annotation itself, which is the thing holding the guarantee up.
 */
const CREATOR_SCOPED_WITH_MONEY: Array<[file: string, fn: string, props: string]> = [
  [
    'business-emails.ts',
    'sendBusinessCreatorBookingConfirmationEmail',
    'BusinessBookingConfirmationEmailProps',
  ],
  [
    'business-emails.ts',
    'sendBusinessCreatorBookingCancellationEmail',
    'BusinessBookingCancelledEmailProps',
  ],
];

describe('staff copies', () => {
  it.each(CREATOR_SCOPED_WITH_MONEY)(
    '%s %s declares itself the creator variant and is type-checked against %s',
    (file, fn, props) => {
      const body = bodyOf(file, fn);

      expect(body).toContain("audience: 'creator'");
      expect(body).toContain(`satisfies ${props}`);
      // The wallet balance and the wallet CTA both belong to the owner alone.
      expect(body).not.toContain('newBalance');
      expect(body).not.toContain('walletUrl');
    }
  );
});

describe('the three lists together', () => {
  it('cover every send in the business and wallet services', () => {
    const named = new Set(
      [...PLATFORM_ONLY, ...PASSENGER_SCOPED, ...BUSINESS_SIDE_SCOPED].map(([file, fn]) => `${file}:${fn}`)
    );

    for (const file of ['business-emails.ts', 'wallet-emails.ts']) {
      const exported = Array.from(source(file).matchAll(/export async function (\w+)/g)).map((m) => m[1]);

      for (const fn of exported) {
        expect(named.has(`${file}:${fn}`)).toBe(true);
      }
    }
  });
});

/**
 * The business module owns its own email presentation and must not reach back into the
 * shared one, except through two named files.
 *
 * `brand.ts` is isomorphic and carries the brand accessor. `platform.ts` is server-only
 * and carries the sender. The split is not cosmetic: templates are rendered in a browser
 * by app/admin/emails/components/email-management-client.tsx for the admin preview, and
 * reaching the brand through the sender's module pulled nodemailer, AsyncLocalStorage
 * and lib/email/transport/crypto (which throws when `window` is defined) into the client
 * bundle. The Vercel build failed generating that chunk while every test here passed.
 */
const BOUNDARY_FILES = ['brand.ts', 'platform.ts'];

function businessEmailFiles(): string[] {
  const { readdirSync, statSync } = require('fs') as typeof import('fs');
  const root = join(process.cwd(), 'lib/business/email');

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });

  return walk(root);
}

describe('the module boundary', () => {
  it('is crossed by exactly the two boundary files', () => {
    const offenders = businessEmailFiles().filter((file) => {
      if (BOUNDARY_FILES.some((name) => file.endsWith(`/${name}`))) return false;
      return /^import[^;]*from '[^']*lib\/email/m.test(readFileSync(file, 'utf8'));
    });

    expect(offenders).toEqual([]);
  });

  /**
   * The assertion that would have caught the build break.
   *
   * The test above passed the whole time, because it only checked *that* the boundary
   * was crossed once, never which side of it the renderable code sat on. Templates,
   * styles and components are exactly what a client bundle can pull in, so none of them
   * may touch the server-only half.
   */
  it('keeps renderable code away from the server-only half', () => {
    const renderable = businessEmailFiles().filter((file) =>
      ['/templates/', '/styles/', '/components/'].some((dir) => file.includes(dir))
    );

    // Guards the guard: a path rename that empties this list must fail loudly rather
    // than silently assert nothing.
    expect(renderable.length).toBeGreaterThan(15);

    const offenders = renderable.filter((file) =>
      /^import[^;]*from '[^']*platform'/m.test(readFileSync(file, 'utf8'))
    );

    expect(offenders).toEqual([]);
  });
});
