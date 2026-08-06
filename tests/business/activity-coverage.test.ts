/**
 * Coverage gate for the business activity log.
 *
 * This is the guarantee a generic wrapper around requireBusinessAuth would have
 * given, bought without the cost. A wrapper could only ever log
 * "POST /api/business/bookings 201"; it could not produce
 * "Booked BK-2026-0031 for Sarah Khan", because the booking number is generated
 * by a database trigger and exists only in the response body. It also could not
 * produce before/after diffs, since the old value is gone by the time the
 * handler returns.
 *
 * So instead: every mutating handler under app/api/business/** must either log
 * activity, or be listed below with a written reason. Route 36 cannot ship
 * uninstrumented by accident, and the failure is at CI time rather than
 * silently at runtime.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const API_ROOT = join(process.cwd(), 'app/api/business');
const MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'] as const;

/**
 * Routes that mutate but deliberately do not log, each with the reason.
 * Adding a route here is a decision, not an escape hatch: it shows up in review.
 */
const NO_ACTIVITY_LOG: Record<string, string> = {
  'auth/logout/route.ts':
    'Logs security.logout via logBusinessActivity, matched by the import scan.',
  'wallet/webhook/route.ts':
    'Stripe-signed with no session. Credits flow through add_to_wallet, which logs inside the database transaction.',
  'wallet/verify-payment/route.ts':
    'Fallback credit path. Also goes through add_to_wallet, which logs and is idempotent on the payment intent.',
  'wallet/checkout/route.ts':
    'Creates a Stripe Checkout session only. The credit lands later via the webhook and is logged there.',
  'wallet/payment-element/setup-intent/route.ts':
    'Creates a Stripe SetupIntent. Saving the card is logged by the payment-methods route.',
  'wallet/payment-element/create-intent/route.ts':
    'Creates a PaymentIntent. The credit is logged when the webhook settles it.',
  'wallet/payment-element/charge-saved/route.ts':
    'Charges a saved card. The resulting credit is logged by add_to_wallet via the webhook.',
  'wallet/notifications/preferences/route.ts':
    'Writes business_accounts.notification_preferences, captured by the column-scoped settings trigger with a full diff.',
  'settings/payment/route.ts':
    'Writes business_accounts payment columns, captured by the column-scoped settings trigger with a full diff.',
  'settings/quotations/route.ts':
    'Writes business_accounts.quotation_number_prefix, captured by the column-scoped settings trigger.',
  'profile/route.ts':
    'Writes business_accounts company profile columns, captured by the column-scoped settings trigger.',
  'branding/settings/route.ts':
    'Writes brand_name and theme_config, captured by the column-scoped settings trigger.',
  'domain/route.ts':
    'Writes custom_domain, captured by the column-scoped settings trigger. Verification itself is logged in domain/verify.',
  'bookings/[id]/datetime/route.ts':
    'Inserts booking_datetime_modifications, which has its own AFTER INSERT trigger carrying the exact actor.',
  'quotations/[id]/convert/route.ts':
    'Logs quotation.converted; per-trip bookings are logged inside create_booking_with_wallet_deduction.',
  'bookings/[id]/cancel/route.ts':
    'cancel_business_booking_with_refund writes booking.cancelled inside the same transaction, and the route passes p_actor_business_user_id so the row names a person. Logging again here would double count.',
  'activity/purge/route.ts':
    'purge_business_activity writes its own activity.purged row, which by definition must survive the purge it describes.',
};

function walkRoutes(dir: string, prefix = ''): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const relative = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      found.push(...walkRoutes(full, relative));
    } else if (entry === 'route.ts') {
      found.push(relative);
    }
  }
  return found;
}

describe('business activity log coverage', () => {
  const routes = walkRoutes(API_ROOT);

  it('finds the business API routes', () => {
    // A refactor that moves or renames the directory must fail loudly rather
    // than silently pass an empty set.
    expect(routes.length).toBeGreaterThan(20);
  });

  it('every mutating route either logs activity or has a written exemption', () => {
    const uninstrumented: string[] = [];

    for (const route of routes) {
      const source = readFileSync(join(API_ROOT, route), 'utf8');

      const mutates = MUTATING_METHODS.some((method) =>
        new RegExp(`export\\s+(const|async\\s+function)\\s+${method}\\b`).test(source)
      );
      if (!mutates) continue;

      const logs =
        source.includes('logBusinessActivity') ||
        source.includes('activityLogger') ||
        source.includes('logBusinessActivityBatch');

      if (!logs && !(route in NO_ACTIVITY_LOG)) {
        uninstrumented.push(route);
      }
    }

    expect(uninstrumented).toEqual([]);
  });

  it('every exemption still points at a real route', () => {
    // Stops the exemption list rotting into a list of files that no longer
    // exist, which would quietly re-open a gap.
    const stale = Object.keys(NO_ACTIVITY_LOG).filter((route) => !routes.includes(route));
    expect(stale).toEqual([]);
  });

  it('the activity routes themselves are owner gated', () => {
    const activityRoutes = routes.filter((route) => route.startsWith('activity/'));
    expect(activityRoutes.length).toBeGreaterThan(0);

    for (const route of activityRoutes) {
      const source = readFileSync(join(API_ROOT, route), 'utf8');
      // Activity spans wallet amounts and platform decisions about the account,
      // so requireBusinessAuth is not enough anywhere here.
      expect(source).toContain('requireBusinessOwner');
      expect(source).not.toMatch(/requireBusinessAuth\b/);
    }
  });
});
