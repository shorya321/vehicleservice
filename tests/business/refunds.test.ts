import {
  businessRefundRequestSchema,
  refundBlockedReason,
  refundConfirmationMatches,
  refundableAmount,
} from '@/lib/business/refunds';
import {
  businessDeleteBlockedReason,
  businessPortalDeleteBlockedReason,
  businessStatusChangeBlockedReason,
} from '@/lib/business/booking-guards';

describe('refundableAmount', () => {
  it('is what was paid minus what went back, in exact cents', () => {
    expect(refundableAmount(215, 0)).toBe(215);
    expect(refundableAmount(215, 100.1)).toBe(114.9);
    expect(refundableAmount(0.3, 0.1)).toBe(0.2);
  });
  it('never goes negative', () => {
    expect(refundableAmount(100, 150)).toBe(0);
  });
});

describe('refundBlockedReason', () => {
  const ok = { bookingStatus: 'cancelled', paid: 215, alreadyRefunded: 0, amount: 215 };
  it('allows a full or partial refund of a cancelled booking', () => {
    expect(refundBlockedReason(ok)).toBeNull();
    expect(refundBlockedReason({ ...ok, amount: 100 })).toBeNull();
  });
  it('refuses a booking that is not cancelled', () => {
    expect(refundBlockedReason({ ...ok, bookingStatus: 'confirmed' })).toMatch(/Cancel the booking/);
  });
  it('refuses more than is left', () => {
    expect(refundBlockedReason({ ...ok, alreadyRefunded: 100, amount: 115.01 })).toMatch(/at most AED 115.00/);
  });
  it('refuses a second full refund', () => {
    expect(refundBlockedReason({ ...ok, alreadyRefunded: 215 })).toMatch(/already been refunded/);
  });
  it('refuses zero', () => {
    expect(refundBlockedReason({ ...ok, amount: 0 })).toMatch(/above zero/);
  });
});

describe('refundConfirmationMatches', () => {
  it('needs the booking number, forgiving case and spaces', () => {
    expect(refundConfirmationMatches(' b2b-20261016-0001 ', 'B2B-20261016-0001')).toBe(true);
    expect(refundConfirmationMatches('B2B-20261016-0002', 'B2B-20261016-0001')).toBe(false);
    expect(refundConfirmationMatches('', '')).toBe(false);
  });
});

describe('businessRefundRequestSchema', () => {
  const base = {
    bookingId: '11111111-1111-4111-8111-111111111111',
    amount: 215,
    reason: 'Test booking refunded',
    confirmation: 'B2B-1',
  };
  it('accepts a valid request', () => {
    expect(businessRefundRequestSchema.safeParse(base).success).toBe(true);
  });
  it('rejects a short reason and three decimals', () => {
    expect(businessRefundRequestSchema.safeParse({ ...base, reason: 'oops' }).success).toBe(false);
    expect(businessRefundRequestSchema.safeParse({ ...base, amount: 1.234 }).success).toBe(false);
  });
});

describe('businessStatusChangeBlockedReason', () => {
  it('keeps cancelled final', () => {
    expect(businessStatusChangeBlockedReason('cancelled', 'confirmed')).toMatch(/cannot be reopened/);
    expect(businessStatusChangeBlockedReason('cancelled', 'cancelled')).toBeNull();
  });
  it('does not cancel a completed trip', () => {
    expect(businessStatusChangeBlockedReason('completed', 'cancelled')).toMatch(/completed/);
  });
  it('allows the ordinary moves', () => {
    expect(businessStatusChangeBlockedReason('confirmed', 'cancelled')).toBeNull();
    expect(businessStatusChangeBlockedReason('pending', 'confirmed')).toBeNull();
    expect(businessStatusChangeBlockedReason('confirmed', 'completed')).toBeNull();
  });
});

describe('businessDeleteBlockedReason', () => {
  const now = new Date('2026-10-16T08:00:00Z');
  it('refuses an upcoming live booking', () => {
    expect(businessDeleteBlockedReason({ booking_status: 'confirmed', pickup_datetime: '2026-10-21T08:00:00Z' }, now)).toMatch(/Cancel the booking first/);
  });
  it('allows cancelled, completed and past bookings', () => {
    expect(businessDeleteBlockedReason({ booking_status: 'cancelled', pickup_datetime: '2026-10-21T08:00:00Z' }, now)).toBeNull();
    expect(businessDeleteBlockedReason({ booking_status: 'completed', pickup_datetime: null }, now)).toBeNull();
    expect(businessDeleteBlockedReason({ booking_status: 'confirmed', pickup_datetime: '2026-10-10T08:00:00Z' }, now)).toBeNull();
  });
});

describe('businessPortalDeleteBlockedReason', () => {
  const now = new Date('2026-10-16T08:00:00Z');
  const cancelled = { booking_status: 'cancelled', pickup_datetime: '2026-10-21T08:00:00Z' };
  it('keeps a paid, unrefunded cancellation for refund review', () => {
    expect(businessPortalDeleteBlockedReason({ ...cancelled, payment_status: 'completed', wallet_deduction_amount: '215.00' }, now)).toMatch(/refund/);
  });
  it('allows it once refunded, or when nothing was charged', () => {
    expect(businessPortalDeleteBlockedReason({ ...cancelled, payment_status: 'refunded', wallet_deduction_amount: 215 }, now)).toBeNull();
    expect(businessPortalDeleteBlockedReason({ ...cancelled, payment_status: 'completed', wallet_deduction_amount: 0 }, now)).toBeNull();
  });
  it('still refuses an upcoming live booking', () => {
    expect(businessPortalDeleteBlockedReason({ booking_status: 'confirmed', pickup_datetime: '2026-10-21T08:00:00Z', payment_status: 'completed', wallet_deduction_amount: 100 }, now)).toMatch(/Cancel the booking first/);
  });
});

describe('refundBlockedReason when nothing was charged', () => {
  it('says so rather than claiming a full refund', () => {
    expect(refundBlockedReason({ bookingStatus: 'cancelled', paid: 0, alreadyRefunded: 0, amount: 1 })).toMatch(/Nothing was charged/);
  });
});
