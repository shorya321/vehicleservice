/**
 * Business cancellation refund policy.
 *
 * Two tiers, matching the policy already published in contact-faq.tsx and already enforced for
 * consumers in app/account/booking-actions.ts:
 *   >= 24h before pickup -> full refund
 *   <  24h before pickup -> no refund (cancellation still allowed)
 *
 * The 'completed' cases are the important ones: a delivered trip is earned revenue. Both delete
 * routes historically omitted 'completed' from their refund guard, so fixing the refund call
 * without these tests would have started handing money back for trips that already ran.
 */

import {
  getCancellationRefund,
  CANCELLATION_FREE_HOURS,
  NON_REFUNDABLE_STATUSES,
} from '@/lib/business/booking-utils';

const HOUR = 60 * 60 * 1000;

/** A booking whose pickup is `hours` from now. */
const booking = (hours: number, over: Record<string, unknown> = {}) => ({
  booking_status: 'confirmed',
  pickup_datetime: new Date(Date.now() + hours * HOUR).toISOString(),
  wallet_deduction_amount: 100,
  ...over,
});

describe('the 24-hour boundary', () => {
  it('refunds in full comfortably outside the window', () => {
    const r = getCancellationRefund(booking(48));
    expect(r.refundPercent).toBe(100);
    expect(r.refundAmount).toBe(100);
    expect(r.withinFreeWindow).toBe(true);
  });

  it('refunds in full at exactly 24 hours', () => {
    // A minute of slack: the clock advances between constructing the fixture and reading it.
    const r = getCancellationRefund(booking(CANCELLATION_FREE_HOURS + 1 / 60));
    expect(r.refundPercent).toBe(100);
  });

  it('refunds nothing just inside the window', () => {
    const r = getCancellationRefund(booking(23.9));
    expect(r.refundPercent).toBe(0);
    expect(r.refundAmount).toBe(0);
    expect(r.withinFreeWindow).toBe(false);
    expect(r.reason).toMatch(/24 hours before pickup/);
  });

  it('refunds nothing a couple of hours out', () => {
    expect(getCancellationRefund(booking(2)).refundAmount).toBe(0);
  });

  it('refunds nothing once pickup has passed', () => {
    const r = getCancellationRefund(booking(-3));
    expect(r.refundAmount).toBe(0);
    expect(r.hoursUntilPickup).toBeLessThan(0);
  });
});

describe('settled statuses are never refundable, whatever the timing', () => {
  it.each(NON_REFUNDABLE_STATUSES)('returns 0 for %s even 10 days out', (status) => {
    const r = getCancellationRefund(booking(240, { booking_status: status }));
    expect(r.refundAmount).toBe(0);
    expect(r.refundPercent).toBe(0);
  });

  it('explains a completed trip specifically — it was delivered, not merely closed', () => {
    const r = getCancellationRefund(booking(240, { booking_status: 'completed' }));
    expect(r.reason).toMatch(/completed/i);
  });

  it('still refunds the live statuses outside the window', () => {
    for (const status of ['pending', 'confirmed', 'assigned', 'in_progress']) {
      expect(getCancellationRefund(booking(48, { booking_status: status })).refundAmount).toBe(100);
    }
  });
});

describe('refund amount', () => {
  it('never exceeds what was actually deducted', () => {
    const r = getCancellationRefund(booking(48, { wallet_deduction_amount: 137.5 }));
    expect(r.refundAmount).toBe(137.5);
  });

  it('rounds to the 2dp the wallet columns store', () => {
    const r = getCancellationRefund(booking(48, { wallet_deduction_amount: 99.999 }));
    expect(r.refundAmount).toBe(100);
  });

  it('returns 0 when nothing was charged, rather than a phantom refund', () => {
    const r = getCancellationRefund(booking(48, { wallet_deduction_amount: 0 }));
    expect(r.refundAmount).toBe(0);
    expect(r.reason).toMatch(/nothing was charged/i);
  });

  it('treats a missing deduction as 0 rather than NaN', () => {
    const r = getCancellationRefund(
      booking(48, { wallet_deduction_amount: undefined as unknown as number })
    );
    expect(r.refundAmount).toBe(0);
    expect(Number.isNaN(r.refundAmount)).toBe(false);
  });

  it('does not throw on a malformed pickup datetime', () => {
    const r = getCancellationRefund({
      booking_status: 'confirmed',
      pickup_datetime: 'not a date',
      wallet_deduction_amount: 100,
    });
    expect(r.refundAmount).toBe(0);
  });
});

describe('timezone independence', () => {
  it('depends on the interval to pickup, not on any wall-clock timezone', () => {
    // Same instant expressed in two offsets must yield the same decision.
    const instant = new Date(Date.now() + 48 * HOUR);
    const utc = instant.toISOString();
    const dubai = new Date(instant).toISOString().replace('Z', '+00:00');

    expect(getCancellationRefund(booking(0, { pickup_datetime: utc })).refundPercent).toBe(
      getCancellationRefund(booking(0, { pickup_datetime: dubai })).refundPercent
    );
  });
});
