/**
 * Staff on a business account received no email at all: every business-side booking
 * message went to business_accounts.business_email regardless of who created the booking.
 * The fix adds a second send addressed to the creator, and the whole risk of that fix
 * lives in one decision - when NOT to send it.
 *
 * These tests pin that decision. Get it wrong in one direction and an owner gets two
 * identical emails for every booking they make themselves; wrong in the other and a
 * deactivated ex-colleague keeps receiving a tenant's booking traffic.
 *
 * Pure by design. The 13 call sites are route handlers and server actions that no test in
 * this repo can reach, so the policy was deliberately split out of the loaders to be
 * testable without a database.
 */

import {
  buildBusinessSideRecipients,
  creatorWantsStatus,
  type BookingCreator,
} from '@/lib/business/email/recipients';

const OWNER_EMAIL = 'owner@acmehotel.com';

const creator = (overrides: Partial<BookingCreator> = {}): BookingCreator => ({
  memberId: 'member-1',
  email: 'priya@acmehotel.com',
  name: 'Priya Sharma',
  role: 'staff',
  isActive: true,
  ...overrides,
});

const build = (
  overrides: Partial<Parameters<typeof buildBusinessSideRecipients>[0]> = {}
) =>
  buildBusinessSideRecipients({
    ownerEmail: OWNER_EMAIL,
    ownerName: 'Acme Hotel',
    creator: creator(),
    ...overrides,
  });

describe('buildBusinessSideRecipients', () => {
  describe('the happy path', () => {
    it('addresses both the owner and the staff creator', () => {
      const { owner, creator: staff } = build();

      expect(owner?.email).toBe(OWNER_EMAIL);
      expect(staff?.email).toBe('priya@acmehotel.com');
      expect(staff?.memberId).toBe('member-1');
      expect(staff?.role).toBe('staff');
    });

    it('attributes the booking to the staff member for the owner copy', () => {
      expect(build().bookedBy).toBe('Booked by Priya Sharma (staff)');
    });

    it('falls back to the address when the creator has no name on file', () => {
      expect(build({ creator: creator({ name: null }) }).bookedBy).toBe(
        'Booked by priya@acmehotel.com (staff)'
      );
    });
  });

  describe('suppression', () => {
    it('sends once when no creator was recorded', () => {
      // ON DELETE SET NULL: this is every booking made by a removed team member.
      const { owner, creator: staff, bookedBy } = build({ creator: null });

      expect(owner?.email).toBe(OWNER_EMAIL);
      expect(staff).toBeNull();
      expect(bookedBy).toBeNull();
    });

    it('sends once, and attributes nothing, when the owner booked it themselves', () => {
      const { creator: staff, bookedBy } = build({
        creator: creator({ role: 'owner', email: OWNER_EMAIL }),
      });

      expect(staff).toBeNull();
      // "Booked by you" is noise on your own email.
      expect(bookedBy).toBeNull();
    });

    it('checks the role before the address', () => {
      // resolveMemberIdentity falls back to business_email for owners, so an owner whose
      // own row is sparse resolves to a DIFFERENT address than the account. The role rule
      // still has to win, or the owner gets two copies.
      const { creator: staff, bookedBy } = build({
        creator: creator({ role: 'owner', email: 'personal@example.com' }),
      });

      expect(staff).toBeNull();
      expect(bookedBy).toBeNull();
    });

    it('does not mail the creator about their own action', () => {
      const { creator: staff, bookedBy } = build({ actorMemberId: 'member-1' });

      expect(staff).toBeNull();
      // The owner still learns who did it.
      expect(bookedBy).toBe('Booked by Priya Sharma (staff)');
    });

    it('still mails the creator when somebody else acted', () => {
      expect(build({ actorMemberId: 'member-2' }).creator?.email).toBe('priya@acmehotel.com');
    });

    it('does not mail a deactivated member', () => {
      const { creator: staff, bookedBy } = build({ creator: creator({ isActive: false }) });

      expect(staff).toBeNull();
      expect(bookedBy).toBe('Booked by Priya Sharma (staff)');
    });

    it('does not mail a creator with no resolvable address', () => {
      const { creator: staff, bookedBy } = build({
        creator: creator({ email: null, name: 'Priya Sharma' }),
      });

      expect(staff).toBeNull();
      expect(bookedBy).toBe('Booked by Priya Sharma (staff)');
    });

    it('sends once when the creator shares the owner mailbox', () => {
      const { owner, creator: staff, bookedBy } = build({
        creator: creator({ email: OWNER_EMAIL }),
      });

      // The surviving copy is the owner's, which carries the wallet balance. Correct:
      // the address is the tenant's own.
      expect(owner?.email).toBe(OWNER_EMAIL);
      expect(staff).toBeNull();
      expect(bookedBy).toBe('Booked by Priya Sharma (staff)');
    });

    it('compares addresses case-insensitively and ignoring padding', () => {
      expect(build({ creator: creator({ email: '  Owner@AcmeHotel.com ' }) }).creator).toBeNull();
    });
  });

  describe('a tenant with no address on file', () => {
    it('yields no owner recipient but still mails the creator', () => {
      const { owner, creator: staff } = build({ ownerEmail: null });

      expect(owner).toBeNull();
      expect(staff?.email).toBe('priya@acmehotel.com');
    });

    it('does not treat two missing addresses as a match', () => {
      const { creator: staff } = build({
        ownerEmail: null,
        creator: creator({ email: null }),
      });

      expect(staff).toBeNull();
    });
  });
});

describe('creatorWantsStatus', () => {
  it('accepts confirmed, which changes what staff tell the guest', () => {
    expect(creatorWantsStatus('confirmed')).toBe(true);
  });

  it.each(['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded'])(
    'rejects %s',
    (status) => {
      expect(creatorWantsStatus(status)).toBe(false);
    }
  );
});
