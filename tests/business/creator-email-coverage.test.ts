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
  // The two portal delete routes are deliberately absent. Deleting is an internal
  // tidy-up, not a cancellation, and reusing the cancellation fan-out for it mailed
  // owners "Booking Cancelled - #TRIP" for bookings they had already cancelled. What
  // the delete routes must and must not send is pinned below instead.
  ['app/api/business/bookings/[id]/datetime/route.ts', 'notifyBusinessBookingRescheduled'],
  ['app/admin/(shell)/bookings/actions.ts', 'notifyBusinessBookingCancelled'],
  ['app/admin/(shell)/bookings/actions.ts', 'notifyBusinessBookingStatus'],
  ['app/vendor/bookings/actions.ts', 'notifyBusinessDriverAssigned'],
  ['app/vendor/bookings/actions.ts', 'notifyBusinessVendorRejected'],
];

/** The two portal routes that hard-delete a booking. Pinned in detail further down. */
const DELETE_ROUTES = [
  'app/api/business/bookings/[id]/route.ts',
  'app/api/business/bookings/bulk-delete/route.ts',
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
  const callSites = Array.from(
    new Set([...TRIGGER_SITES.map(([path]) => path), ...DELETE_ROUTES])
  );

  it.each(callSites)('%s reaches them only through the fan-out', (path) => {
    const source = read(path);

    for (const sender of FANNED_OUT_SENDERS) {
      expect(source).not.toContain(sender);
    }
  });
});

/**
 * The portal delete routes.
 *
 * Three separate bugs put mail in a passenger's inbox for a booking that had not moved:
 *
 *   1. every send was scheduled BEFORE the delete ran, so a refused delete (a booking
 *      converted from a quotation is held by an ON DELETE RESTRICT key) still mailed
 *      everyone - three attempts on one booking, three cancellation emails, and the
 *      booking still sitting there;
 *   2. nothing checked the status, so deleting an already-cancelled booking sent the
 *      passenger a second "your transfer has been cancelled";
 *   3. the business side was told through the CANCELLATION fan-out, so owners got
 *      "Booking Cancelled - #TRIP" for a delete.
 *
 * These pin all three. They are source assertions for the reason at the top of this file:
 * route handlers are unreachable from this suite.
 */
describe('the portal delete routes', () => {
  it.each(DELETE_ROUTES)('%s does not send the business-side cancellation', (path) => {
    expect(read(path)).not.toContain('notifyBusinessBookingCancelled(');
  });

  it.each(DELETE_ROUTES)('%s refuses a quotation-derived booking before sending', (path) => {
    const source = read(path);

    const preflight = source.indexOf("from('business_quotation_items')");
    const send = source.indexOf('sendBusinessCustomerBookingCancelledEmail(');

    expect(preflight).toBeGreaterThan(-1);
    expect(send).toBeGreaterThan(-1);
    expect(preflight).toBeLessThan(send);
  });

  it.each(DELETE_ROUTES)('%s sends nothing until the row is gone', (path) => {
    const source = read(path);

    const del = source.indexOf('.delete()');
    const send = source.indexOf('sendBusinessCustomerBookingCancelledEmail(');

    expect(del).toBeGreaterThan(-1);
    expect(send).toBeGreaterThan(del);
  });

  it.each(DELETE_ROUTES)('%s only emails a passenger whose trip is still ahead', (path) => {
    expect(read(path)).toContain('isActiveBookingStatus(');
  });

  it.each(DELETE_ROUTES)('%s can tell a real delete from a no-op', (path) => {
    // .select('id') on the delete: without it two clicks both report success and both
    // mail the passenger.
    expect(read(path)).toContain(".select('id')");
  });
});

/**
 * One cancellation, one bell.
 *
 * `trigger_notify_business_booking_status_changed` already writes a "Booking Cancelled"
 * notification for `created_by_user_id`. The route adds a richer one for the owner, and
 * when the owner IS the creator - a single-user tenant, the common case - that put two
 * rows in the tray one second apart for one cancellation.
 */
describe('the portal cancel route', () => {
  it('does not add an owner notification the status trigger already sent', () => {
    expect(read('app/api/business/bookings/[id]/cancel/route.ts')).toContain(
      'ownerUser.auth_user_id !== creatorAuthUserId'
    );
  });
});

/**
 * Rewriting a booking to the status it already holds is not a change, but it used to fire
 * the whole notification set: re-cancelling an already-cancelled booking mailed the
 * passenger again.
 */
describe('admin status updates', () => {
  it('refuse to re-send for a status that is not changing', () => {
    const source = read('app/admin/(shell)/bookings/actions.ts');

    expect(source).toContain('previousStatus === status');
    expect(source).toContain('previousStatuses.get(id) !== status');
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
