/**
 * The fan-out exists because the pattern it replaces has failed twice in this codebase,
 * both times recorded in the comments left behind: bulk cancellation once sent only the
 * passenger copy, and assigning a vendor once notified the vendor and the driver and left
 * the business hearing nothing. Both were a call site forgetting one of a pair.
 *
 * So the thing worth testing is not that a send happens. It is the arithmetic: exactly
 * two sends when two are owed, exactly one when the second would be a duplicate, and none
 * to a staff member who was scoped out of that event.
 *
 * The senders are mocked. Their transport and their template props are already pinned by
 * tests/email/platform-only.test.ts and tests/business/staff-email-redaction.test.ts, and
 * the real module reaches nodemailer, which this repo's jest config cannot load.
 */

jest.mock('@/lib/business/email/services/business-emails', () => ({
  sendBusinessBookingConfirmationEmail: jest.fn(),
  sendBusinessCreatorBookingConfirmationEmail: jest.fn(),
  sendBusinessBookingCancellationEmail: jest.fn(),
  sendBusinessCreatorBookingCancellationEmail: jest.fn(),
  sendBusinessBookingStatusUpdateEmail: jest.fn(),
  sendBusinessCreatorBookingStatusUpdateEmail: jest.fn(),
  sendBusinessDriverAssignedEmail: jest.fn(),
  sendBusinessCreatorDriverAssignedEmail: jest.fn(),
  sendBusinessVendorRejectedEmail: jest.fn(),
  sendBusinessCreatorVendorRejectedEmail: jest.fn(),
  sendBusinessBookingDatetimeChangedEmail: jest.fn(),
  sendBusinessCreatorDatetimeChangedEmail: jest.fn(),
}));

import {
  notifyBusinessBookingCreated,
  notifyBusinessBookingStatus,
  notifyBusinessDriverAssigned,
} from '@/lib/business/email/notify';
import { buildBusinessSideRecipients } from '@/lib/business/email/recipients';
import type { BookingCreator } from '@/lib/business/email/recipients';
import * as senders from '@/lib/business/email/services/business-emails';

const OWNER_EMAIL = 'owner@acmehotel.com';
const STAFF_EMAIL = 'priya@acmehotel.com';

const staff: BookingCreator = {
  memberId: 'member-1',
  email: STAFF_EMAIL,
  name: 'Priya Sharma',
  role: 'staff',
  isActive: true,
};

const recipients = (creator: BookingCreator | null, actorMemberId?: string) =>
  buildBusinessSideRecipients({
    ownerEmail: OWNER_EMAIL,
    ownerName: 'Acme Hotel',
    creator,
    actorMemberId,
  });

const confirmation = {
  businessAccountId: 'account-1',
  businessName: 'Acme Hotel',
  bookingNumber: 'BK-1001',
  customerName: 'Guest Name',
  pickupLocation: 'Dubai International Airport',
  dropoffLocation: 'Acme Hotel Downtown',
  pickupDateTime: 'Monday, 24 August 2026 at 3:00 PM',
  vehicleType: 'Business Sedan',
  passengerCount: 2,
  totalPrice: 250,
  currency: 'AED',
  walletDeducted: 250,
  newBalance: 1000,
  bookingUrl: 'https://example.com/business/bookings/abc',
};

const statusChange = {
  businessAccountId: 'account-1',
  businessName: 'Acme Hotel',
  bookingNumber: 'BK-1001',
  customerName: 'Guest Name',
  pickupLocation: 'Dubai International Airport',
  dropoffLocation: 'Acme Hotel Downtown',
  pickupDateTime: 'Monday, 24 August 2026 at 3:00 PM',
  previousStatus: 'pending',
  newStatus: 'confirmed',
};

const driverAssigned = {
  businessAccountId: 'account-1',
  businessName: 'Acme Hotel',
  bookingId: 'booking-1',
  bookingReference: 'BK-1001',
  passengerName: 'Guest Name',
  driverName: 'Imran Khan',
  driverPhone: '+971500000000',
  pickupDate: '24 August 2026',
  pickupTime: '3:00 PM',
  pickupLocation: 'Dubai International Airport',
  dropoffLocation: 'Acme Hotel Downtown',
  vehicleType: 'Business Sedan',
};

// jest.config.js sets resetMocks: true, which strips implementations before each test.
// The resolved value therefore has to be re-applied here rather than in the factory.
beforeEach(() => {
  // The namespace object carries interop members (__esModule) alongside the mocks.
  for (const sender of Object.values(senders)) {
    if (jest.isMockFunction(sender)) {
      sender.mockResolvedValue({ success: true });
    }
  }
});

describe('a booking created by a staff member', () => {
  it('sends to the owner and to the staff member', async () => {
    const result = await notifyBusinessBookingCreated(recipients(staff), confirmation);

    expect(senders.sendBusinessBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(senders.sendBusinessCreatorBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(result.owner).toEqual({ success: true });
    expect(result.creator).toEqual({ success: true });
  });

  it('addresses each copy to its own recipient', async () => {
    await notifyBusinessBookingCreated(recipients(staff), confirmation);

    expect(senders.sendBusinessBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: OWNER_EMAIL })
    );
    expect(senders.sendBusinessCreatorBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: STAFF_EMAIL })
    );
  });

  it('attributes the booking on the owner copy only', async () => {
    await notifyBusinessBookingCreated(recipients(staff), confirmation);

    expect(senders.sendBusinessBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ bookedBy: 'Booked by Priya Sharma (staff)' })
    );
    // Telling somebody they booked it is noise on their own email.
    const creatorArg = (senders.sendBusinessCreatorBookingConfirmationEmail as jest.Mock).mock
      .calls[0][0];
    expect(creatorArg.bookedBy).toBeUndefined();
  });

  it('never puts the running balance in the staff copy', async () => {
    await notifyBusinessBookingCreated(recipients(staff), confirmation);

    const creatorArg = (senders.sendBusinessCreatorBookingConfirmationEmail as jest.Mock).mock
      .calls[0][0];
    expect(creatorArg.newBalance).toBeUndefined();

    expect(senders.sendBusinessBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ newBalance: 1000 })
    );
  });
});

describe('a booking created by the owner', () => {
  it('sends once, not twice', async () => {
    const owner: BookingCreator = {
      memberId: 'member-owner',
      email: OWNER_EMAIL,
      name: 'Acme Owner',
      role: 'owner',
      isActive: true,
    };

    const result = await notifyBusinessBookingCreated(recipients(owner), confirmation);

    expect(senders.sendBusinessBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(senders.sendBusinessCreatorBookingConfirmationEmail).not.toHaveBeenCalled();
    expect(result.creator).toBeNull();
  });
});

describe('a deactivated staff member', () => {
  it('is not written to, but is still named to the owner', async () => {
    await notifyBusinessBookingCreated(
      recipients({ ...staff, isActive: false }),
      confirmation
    );

    expect(senders.sendBusinessCreatorBookingConfirmationEmail).not.toHaveBeenCalled();
    expect(senders.sendBusinessBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ bookedBy: 'Booked by Priya Sharma (staff)' })
    );
  });
});

describe('status changes', () => {
  it('reach the staff member when the booking is confirmed', async () => {
    await notifyBusinessBookingStatus(recipients(staff), statusChange);

    expect(senders.sendBusinessBookingStatusUpdateEmail).toHaveBeenCalledTimes(1);
    expect(senders.sendBusinessCreatorBookingStatusUpdateEmail).toHaveBeenCalledTimes(1);
  });

  it.each(['in_progress', 'completed'])(
    'reach the owner but not the staff member on %s',
    async (newStatus) => {
      const result = await notifyBusinessBookingStatus(recipients(staff), {
        ...statusChange,
        newStatus,
      });

      // The owner sender carries every status in the system; the staff member was scoped
      // to the one that changes what they tell the guest.
      expect(senders.sendBusinessBookingStatusUpdateEmail).toHaveBeenCalledTimes(1);
      expect(senders.sendBusinessCreatorBookingStatusUpdateEmail).not.toHaveBeenCalled();
      expect(result.creator).toBeNull();
    }
  );
});

describe('driver assignment', () => {
  it('reaches both, each on their own address', async () => {
    await notifyBusinessDriverAssigned(recipients(staff), driverAssigned);

    expect(senders.sendBusinessDriverAssignedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ businessEmail: OWNER_EMAIL })
    );
    expect(senders.sendBusinessCreatorDriverAssignedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ businessEmail: STAFF_EMAIL })
    );
  });
});

describe('when a staff member acts on their own booking', () => {
  it('the owner still hears about it and the staff member does not', async () => {
    const result = await notifyBusinessBookingStatus(
      recipients(staff, 'member-1'),
      statusChange
    );

    expect(senders.sendBusinessBookingStatusUpdateEmail).toHaveBeenCalledTimes(1);
    expect(senders.sendBusinessCreatorBookingStatusUpdateEmail).not.toHaveBeenCalled();
    expect(result.creator).toBeNull();
  });
});

describe('a failing send', () => {
  it('does not throw, and does not cost the other recipient their copy', async () => {
    (senders.sendBusinessCreatorBookingConfirmationEmail as jest.Mock).mockRejectedValueOnce(
      new Error('connect ECONNREFUSED')
    );

    const result = await notifyBusinessBookingCreated(recipients(staff), confirmation);

    expect(result.creator).toBeNull();
    // A booking that succeeded must not be reported as failed because a mail server was
    // unreachable, and one bad address must not take the owner's copy with it.
    expect(result.owner).toEqual({ success: true });
  });
});

describe('a tenant with no address on file', () => {
  it('still reaches the staff member', async () => {
    const only = buildBusinessSideRecipients({
      ownerEmail: null,
      ownerName: null,
      creator: staff,
    });

    await notifyBusinessBookingCreated(only, confirmation);

    expect(senders.sendBusinessBookingConfirmationEmail).not.toHaveBeenCalled();
    expect(senders.sendBusinessCreatorBookingConfirmationEmail).toHaveBeenCalledTimes(1);
  });
});
