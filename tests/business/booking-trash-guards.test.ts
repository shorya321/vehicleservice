/**
 * Which quotation trips may go to the trash.
 *
 * A quotation trip that ran (completed, or past its pickup) is the history the quotation points
 * to, so only a trip whose every journey was cancelled can be deleted. Half a cancelled round
 * trip still has a live journey on the road.
 */

import { quotationTripDeleteBlockedReason } from '@/lib/business/booking-guards';

describe('quotationTripDeleteBlockedReason', () => {
  it('allows a cancelled one-way trip', () => {
    expect(quotationTripDeleteBlockedReason([{ booking_status: 'cancelled' }])).toBeNull();
  });

  it('allows a round trip once both journeys are cancelled', () => {
    expect(
      quotationTripDeleteBlockedReason([{ booking_status: 'cancelled' }, { booking_status: 'cancelled' }])
    ).toBeNull();
  });

  it('blocks a round trip with one journey still live', () => {
    expect(
      quotationTripDeleteBlockedReason([{ booking_status: 'cancelled' }, { booking_status: 'confirmed' }])
    ).toMatch(/Cancel every journey/);
  });

  it('blocks a completed quotation trip, which the generic rule would allow', () => {
    expect(quotationTripDeleteBlockedReason([{ booking_status: 'completed' }])).toMatch(/Cancel every journey/);
  });

  it('blocks when nothing was loaded rather than allowing an empty trip', () => {
    expect(quotationTripDeleteBlockedReason([])).not.toBeNull();
  });
});
