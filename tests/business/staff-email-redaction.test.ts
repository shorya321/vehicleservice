/**
 * The wallet belongs to the owner, and the portal already says so: the dashboard zeroes
 * the balance tile for staff and /business/wallet redirects them to the dashboard.
 *
 * Adding a staff copy of the booking emails put that boundary at risk, because the owner
 * templates print the tenant's running balance and, on cancellation, link to the wallet
 * page. This renders both variants and pins the difference, so "the staff copy does not
 * carry the balance" is a fact about the bytes rather than a claim about the props.
 *
 * The discriminated union in each template means a staff copy *cannot* be given a
 * balance; these tests exist to catch someone widening the union back out.
 */

import { jsx } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import BusinessBookingConfirmationEmail from '@/lib/business/email/templates/booking-confirmation';
import BusinessBookingCancelledEmail from '@/lib/business/email/templates/booking-cancelled';
import BusinessBookingDatetimeChangedEmail from '@/lib/business/email/templates/booking-datetime-changed';

/**
 * react-dom/server rather than @react-email/render, which resolves its plain-text
 * converter through a dynamic import and dies under this repo's jest config with
 * "A dynamic import callback was invoked without --experimental-vm-modules" - the same
 * failure that already takes out the six suites under tests/email/.
 *
 * These assertions are about which markup is present, so static markup is the right
 * level anyway: the pretty-printing @react-email/render adds on top is not under test.
 */
const render = (element: ReactElement): string => renderToStaticMarkup(element);

const confirmationFacts = {
  businessName: 'Acme Hotel',
  bookingNumber: 'BK-1001',
  tripNumber: 'TRIP-1001',
  customerName: 'Guest Name',
  pickupLocation: 'Dubai International Airport',
  dropoffLocation: 'Acme Hotel Downtown',
  pickupDateTime: 'Monday, 24 August 2026 at 3:00 PM',
  vehicleType: 'Business Sedan',
  passengerCount: 2,
  totalPrice: 250,
  currency: 'AED',
  walletDeducted: 250,
  bookingUrl: 'https://example.com/business/bookings/abc',
};

const cancelledFacts = {
  businessName: 'Acme Hotel',
  bookingNumber: 'BK-1001',
  tripNumber: 'TRIP-1001',
  customerName: 'Guest Name',
  pickupLocation: 'Dubai International Airport',
  dropoffLocation: 'Acme Hotel Downtown',
  pickupDateTime: 'Monday, 24 August 2026 at 3:00 PM',
  refundAmount: 250,
  currency: 'AED',
};

/** The tenant's running balance, which only the owner may see. */
const BALANCE_LABEL = 'New Wallet Balance';
const BALANCE_FIGURE = '1000.00';

describe('booking confirmation', () => {
  it('shows the owner the running balance', () => {
    const html = render(
      jsx(BusinessBookingConfirmationEmail, {
        ...confirmationFacts,
        audience: 'owner',
        newBalance: 1000,
      })
    );

    expect(html).toContain(BALANCE_LABEL);
    expect(html).toContain('1000.00');
  });

  it('does not show the staff creator the running balance', () => {
    const html = render(
      jsx(BusinessBookingConfirmationEmail, { ...confirmationFacts, audience: 'creator' })
    );

    expect(html).not.toContain(BALANCE_LABEL);
    expect(html).not.toContain(BALANCE_FIGURE);
  });

  it('still shows the staff creator the figures for this booking', () => {
    const html = render(
      jsx(BusinessBookingConfirmationEmail, { ...confirmationFacts, audience: 'creator' })
    );

    // Both appear on the portal booking detail a staff member can already open, so
    // withholding them here would tell them less than the UI does.
    expect(html).toContain('Booking Total');
    expect(html).toContain('Deducted from Wallet');
    expect(html).toContain('250.00');
  });
});

describe('booking cancellation', () => {
  it('shows the owner the balance and the wallet link', () => {
    const html = render(
      jsx(BusinessBookingCancelledEmail, {
        ...cancelledFacts,
        audience: 'owner',
        newBalance: 1000,
        walletUrl: 'https://example.com/business/wallet',
      })
    );

    expect(html).toContain(BALANCE_LABEL);
    expect(html).toContain('/business/wallet');
    expect(html).toContain('credited back to your wallet');
  });

  it('shows the staff creator neither the balance nor a link that would bounce them', () => {
    const html = render(
      jsx(BusinessBookingCancelledEmail, { ...cancelledFacts, audience: 'creator' })
    );

    expect(html).not.toContain(BALANCE_LABEL);
    expect(html).not.toContain(BALANCE_FIGURE);
    // /business/wallet redirects staff to the dashboard: a CTA that bounces the reader is
    // worse than no CTA.
    expect(html).not.toContain('/business/wallet');
    expect(html).not.toContain('View Wallet Balance');
  });

  it('still shows the staff creator the refund for this booking', () => {
    const html = render(
      jsx(BusinessBookingCancelledEmail, { ...cancelledFacts, audience: 'creator' })
    );

    expect(html).toContain('Refund Amount');
    expect(html).toContain('250.00');
  });
});

describe('the booked-by attribution', () => {
  it('names the staff member on the owner copy', () => {
    const html = render(
      jsx(BusinessBookingConfirmationEmail, {
        ...confirmationFacts,
        audience: 'owner',
        newBalance: 1000,
        bookedBy: 'Booked by Priya Sharma (staff)',
      })
    );

    expect(html).toContain('Booked by Priya Sharma (staff)');
  });

  it('renders nothing when the owner booked it themselves', () => {
    const html = render(
      jsx(BusinessBookingConfirmationEmail, {
        ...confirmationFacts,
        audience: 'owner',
        newBalance: 1000,
      })
    );

    expect(html).not.toContain('Booked by');
  });
});

describe('the reschedule template', () => {
  it('addresses the business, not the passenger', () => {
    const html = render(
      jsx(BusinessBookingDatetimeChangedEmail, {
        businessName: 'Acme Hotel',
        bookingNumber: 'BK-1001',
        tripNumber: 'TRIP-1001',
        customerName: 'Guest Name',
        pickupLocation: 'Dubai International Airport',
        previousDateTime: 'Monday, 24 August 2026 at 3:00 PM',
        newDateTime: 'Monday, 24 August 2026 at 6:00 PM',
        bookingUrl: 'https://example.com/business/bookings/abc',
      })
    );

    // The passenger template greets the guest and points them at the business for
    // support. Sent to the business, that would greet them as their own guest.
    expect(html).toContain('Hi Acme Hotel');
    expect(html).not.toContain('Hi Guest Name');
    expect(html).toContain('Previous Time');
    expect(html).toContain('New Time');
  });

  it('carries no wallet surface for either audience', () => {
    const html = render(
      jsx(BusinessBookingDatetimeChangedEmail, {
        businessName: 'Acme Hotel',
        bookingNumber: 'BK-1001',
        customerName: 'Guest Name',
        pickupLocation: 'Dubai International Airport',
        previousDateTime: 'Monday, 24 August 2026 at 3:00 PM',
        newDateTime: 'Monday, 24 August 2026 at 6:00 PM',
        bookingUrl: 'https://example.com/business/bookings/abc',
      })
    );

    expect(html).not.toContain(BALANCE_LABEL);
    expect(html).not.toContain('/business/wallet');
  });
});
