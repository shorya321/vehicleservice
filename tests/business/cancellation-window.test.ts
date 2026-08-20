/**
 * Who may cancel a business booking, and for how long.
 *
 * The rule this encodes is deliberately narrow: a business gets a short grace
 * period after creating a booking to undo its own mistake, and nothing more.
 * Once a vehicle is assigned, or once the window closes, cancelling becomes a
 * conversation with the platform team. Cancelling never returns money either
 * way - refunds are issued by hand.
 *
 * The assignment case is the one worth understanding. `booking_status` is never
 * set to 'assigned' anywhere in the product: vendor assignment lives in
 * `booking_assignments.status`, so a booking with a driver on it still reads
 * 'confirmed'. Before this guard existed, that meant a business could cancel a
 * booking a vendor had already accepted and be refunded in full. Any future
 * attempt to express that check as a status comparison will pass a status test
 * and fail this one, which is the point.
 */

import {
  getCancellationEligibility,
  BUSINESS_CANCELLABLE_STATUSES,
  NON_REFUNDABLE_STATUSES,
} from '@/lib/business/booking-utils';

const MINUTE = 60 * 1000;
const WINDOW = 30;

/** A booking created `minutesAgo` in the past. */
const booking = (minutesAgo: number, over: Record<string, unknown> = {}) => ({
  booking_status: 'confirmed',
  created_at: new Date(Date.now() - minutesAgo * MINUTE).toISOString(),
  ...over,
});

const opts = (over: Partial<{ windowMinutes: number; hasActiveAssignment: boolean }> = {}) => ({
  windowMinutes: WINDOW,
  hasActiveAssignment: false,
  ...over,
});

describe('the grace period', () => {
  it('allows a cancellation moments after the booking was made', () => {
    const e = getCancellationEligibility(booking(0), opts());
    expect(e.canCancel).toBe(true);
    expect(e.minutesRemaining).toBe(WINDOW);
  });

  it('counts down as the window closes', () => {
    const e = getCancellationEligibility(booking(25), opts());
    expect(e.canCancel).toBe(true);
    expect(e.minutesRemaining).toBe(5);
  });

  it('never reports 0 minutes left while cancelling is still allowed', () => {
    // 29.99 minutes in: truthfully under a minute, but "0" reads as "closed".
    const e = getCancellationEligibility(booking(29.99), opts());
    expect(e.canCancel).toBe(true);
    expect(e.minutesRemaining).toBe(1);
  });

  it('refuses once the window has elapsed', () => {
    const e = getCancellationEligibility(booking(31), opts());
    expect(e.canCancel).toBe(false);
    expect(e.minutesRemaining).toBe(0);
    expect(e.reason).toMatch(/30-minute cancellation window/);
  });

  it('closes exactly at the boundary, not a moment after', () => {
    const e = getCancellationEligibility(booking(WINDOW), opts());
    expect(e.canCancel).toBe(false);
  });

  it('refuses a booking made days ago', () => {
    expect(getCancellationEligibility(booking(60 * 24 * 3), opts()).canCancel).toBe(false);
  });

  it('names the configured window in the refusal, not a hardcoded 30', () => {
    const e = getCancellationEligibility(booking(10), opts({ windowMinutes: 5 }));
    expect(e.canCancel).toBe(false);
    expect(e.reason).toMatch(/5-minute/);
  });
});

describe('an assigned vehicle outranks the clock', () => {
  it('refuses even a booking created this second', () => {
    const e = getCancellationEligibility(booking(0), opts({ hasActiveAssignment: true }));
    expect(e.canCancel).toBe(false);
    expect(e.reason).toMatch(/assigned/i);
  });

  it('explains the assignment rather than the timing when both apply', () => {
    // Being told "you were two minutes late" invites trying again faster next
    // time, when no amount of speed would have helped.
    const e = getCancellationEligibility(booking(90), opts({ hasActiveAssignment: true }));
    expect(e.canCancel).toBe(false);
    expect(e.reason).toMatch(/assigned/i);
    expect(e.reason).not.toMatch(/window/);
  });
});

describe('statuses', () => {
  it.each(BUSINESS_CANCELLABLE_STATUSES)('allows %s inside the window', (status) => {
    expect(getCancellationEligibility(booking(1, { booking_status: status }), opts()).canCancel)
      .toBe(true);
  });

  it.each(NON_REFUNDABLE_STATUSES)('refuses %s however new the booking', (status) => {
    const e = getCancellationEligibility(booking(0, { booking_status: status }), opts());
    expect(e.canCancel).toBe(false);
    expect(e.reason).toMatch(new RegExp(status));
  });

  it('holds the list the booking detail page has always used, unchanged', () => {
    expect([...BUSINESS_CANCELLABLE_STATUSES]).toEqual(['pending', 'confirmed']);
  });
});

describe('the kill switch', () => {
  it('refuses everything at 0 minutes', () => {
    const e = getCancellationEligibility(booking(0), opts({ windowMinutes: 0 }));
    expect(e.canCancel).toBe(false);
    expect(e.reason).toMatch(/cannot be cancelled from the portal/i);
  });

  it('treats a negative window as off rather than as time travel', () => {
    expect(getCancellationEligibility(booking(0), opts({ windowMinutes: -5 })).canCancel).toBe(
      false
    );
  });

  it('treats a nonsense window as off rather than as unlimited', () => {
    const e = getCancellationEligibility(
      booking(0),
      opts({ windowMinutes: NaN as unknown as number })
    );
    expect(e.canCancel).toBe(false);
  });
});

describe('bad data fails closed', () => {
  it('refuses a malformed created_at instead of granting an unlimited window', () => {
    const e = getCancellationEligibility(
      { booking_status: 'confirmed', created_at: 'not a date' },
      opts()
    );
    expect(e.canCancel).toBe(false);
  });

  it('refuses a missing created_at', () => {
    const e = getCancellationEligibility(
      { booking_status: 'confirmed', created_at: undefined as unknown as string },
      opts()
    );
    expect(e.canCancel).toBe(false);
  });

  it('does not throw on any of it', () => {
    expect(() =>
      getCancellationEligibility({ booking_status: '', created_at: '' }, opts())
    ).not.toThrow();
  });
});

describe('timezone independence', () => {
  it('depends on elapsed time, not on any wall-clock timezone', () => {
    // One instant, two offsets. A grace period is a duration; both must agree.
    const instant = new Date(Date.now() - 10 * MINUTE);
    const utc = instant.toISOString();
    const offset = new Date(instant.getTime()).toISOString().replace('Z', '+00:00');

    expect(getCancellationEligibility({ booking_status: 'confirmed', created_at: utc }, opts()))
      .toEqual(
        getCancellationEligibility({ booking_status: 'confirmed', created_at: offset }, opts())
      );
  });
});
