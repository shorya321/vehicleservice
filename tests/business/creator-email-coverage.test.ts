/**
 * Route handlers and server actions are unreachable from this test suite - jest only
 * matches tests/**\/*.test.ts, and nothing here imports from app/. So the only way to
 * assert anything about the thirteen trigger sites is to read their source, which is the
 * technique tests/email/platform-only.test.ts already uses for transport.
 *
 * What is worth guarding is not that some email is sent. It is that no site sends to the
 * owner *without* also going through the fan-out, because that is precisely the failure
 * this feature is repairing: for years every business-side send addressed
 * business_accounts.business_email and the staff member who created the booking got
 * nothing.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..', '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');

/** Every site that must reach the booking's creator, and the fan-out it must use. */
const TRIGGER_SITES: Array<[path: string, notify: string]> = [
  ['app/api/business/bookings/route.ts', 'notifyBusinessBookingCreated'],
  ['app/api/business/quotations/[id]/convert/route.ts', 'notifyBusinessBookingCreated'],
  ['app/api/business/bookings/[id]/cancel/route.ts', 'notifyBusinessBookingCancelled'],
  ['app/api/business/bookings/[id]/route.ts', 'notifyBusinessBookingCancelled'],
  ['app/api/business/bookings/bulk-delete/route.ts', 'notifyBusinessBookingCancelled'],
  ['app/api/business/bookings/[id]/datetime/route.ts', 'notifyBusinessBookingRescheduled'],
  ['app/admin/(shell)/bookings/actions.ts', 'notifyBusinessBookingCancelled'],
  ['app/admin/(shell)/bookings/actions.ts', 'notifyBusinessBookingStatus'],
  ['app/vendor/bookings/actions.ts', 'notifyBusinessDriverAssigned'],
  ['app/vendor/bookings/actions.ts', 'notifyBusinessVendorRejected'],
];

describe('every business-side trigger site', () => {
  it.each(TRIGGER_SITES)('%s fans out through %s', (path, notify) => {
    expect(read(path)).toContain(`${notify}(`);
  });

  it.each(TRIGGER_SITES)('%s resolves a creator for %s', (path) => {
    const source = read(path);

    // Either looked up, or built from the auth context on the wizard path where the
    // creator is the caller.
    expect(
      source.includes('loadBookingCreatorById') || source.includes('memberId: user.businessId')
    ).toBe(true);
  });
});

/**
 * The owner-only senders belong to the fan-out now.
 *
 * A call site reaching one directly is how the third audience gets silently dropped
 * again: the send still works, the owner still hears, and nobody notices the staff member
 * does not. Only notify.ts may call them.
 */
const FANNED_OUT_SENDERS = [
  'sendBusinessBookingConfirmationEmail',
  'sendBusinessBookingCancellationEmail',
  'sendBusinessBookingDatetimeChangedEmail',
  'sendBusinessCreatorBookingConfirmationEmail',
  'sendBusinessCreatorBookingCancellationEmail',
  'sendBusinessCreatorBookingStatusUpdateEmail',
  'sendBusinessCreatorDriverAssignedEmail',
  'sendBusinessCreatorVendorRejectedEmail',
  'sendBusinessCreatorDatetimeChangedEmail',
];

describe('the owner senders', () => {
  const callSites = Array.from(new Set(TRIGGER_SITES.map(([path]) => path)));

  it.each(callSites)('%s reaches them only through the fan-out', (path) => {
    const source = read(path);

    for (const sender of FANNED_OUT_SENDERS) {
      expect(source).not.toContain(sender);
    }
  });
});

/**
 * The delete route used to nest its entire notification block - the passenger email AND
 * the owner's in-app notification - inside `if (booking.customer_email)`, so deleting a
 * booking entered without a passenger address notified nobody at all.
 *
 * Pinning the order is a proxy for "the business-side send is not inside that guard": if
 * someone re-nests it, the send moves after the guard opens.
 */
describe('the portal delete route', () => {
  it('tells the business side before it checks for a passenger address', () => {
    const source = read('app/api/business/bookings/[id]/route.ts');

    const notify = source.indexOf('notifyBusinessBookingCancelled(');
    const guard = source.indexOf('if (booking.customer_email)');

    expect(notify).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(-1);
    expect(notify).toBeLessThan(guard);
  });
});

/**
 * Same shape, same history: rescheduling read the tenant's account and sent everything
 * inside the passenger-address guard, so a booking without one told nobody.
 */
describe('the reschedule route', () => {
  it('tells the business side before it checks for a passenger address', () => {
    const source = read('app/api/business/bookings/[id]/datetime/route.ts');

    const notify = source.indexOf('notifyBusinessBookingRescheduled(');
    const guard = source.indexOf('if (booking.customer_email)');

    expect(notify).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(-1);
    expect(notify).toBeLessThan(guard);
  });
});

/**
 * Admin cancellation told owners their wallet balance was 0.00: refundAmount and
 * newBalance were both hardcoded to 0. refundAmount is right - no refund path exists in
 * that file - but the balance was a lie about the tenant's money.
 */
describe('admin cancellation', () => {
  it('sends the real wallet balance rather than a hardcoded zero', () => {
    const source = read('app/admin/(shell)/bookings/actions.ts');

    expect(source).not.toContain('newBalance: 0,');
    expect(source).toContain('newBalance: emailDetails.walletBalance');
    expect(source).toContain('newBalance: details.walletBalance');
  });
});
