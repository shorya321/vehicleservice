/**
 * Who on the business side hears about a booking.
 *
 * Until this module existed there was one answer: business_accounts.business_email, the
 * address typed once at signup. A staff member could create a booking, watch a driver get
 * assigned to it an hour before pickup, and learn nothing - the mail went to the owner,
 * and the person who had to phone the guest was not on it.
 *
 * business_bookings.created_by_user_id has recorded the creator since
 * 20260720_business_staff_users.sql. The in-app notification trigger added by
 * 20251117_add_business_notifications.sql already routes to it. This is email catching up
 * with the notification bell, not a new idea about who owns a booking.
 *
 * The loading and the policy are separated on purpose: buildBusinessSideRecipients is
 * pure, so the dedupe table it encodes is pinned by a unit test that touches no database.
 * That table is the whole feature. Everything else here is two queries.
 *
 * May not import lib/email - see the boundary note in ./platform.ts. It reaches the admin
 * Supabase client, so it is server-only.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeBusinessRole } from '@/lib/business/roles';
import { resolveMemberIdentity } from '@/lib/business/team-identity';
import type { BusinessRole } from '@/lib/business/roles';

/** One addressable person on the business side of a booking. */
export interface BusinessEmailRecipient {
  /** business_users.id. Null for the account-level address, which belongs to no member. */
  memberId: string | null;
  email: string;
  name: string | null;
  role: BusinessRole;
}

/**
 * The business-side recipients for one booking, after policy.
 *
 * A null `creator` means "send once, to the owner". Callers never compare addresses
 * themselves; if they did, the dedupe would be reimplemented at thirteen call sites and
 * would be wrong at some of them.
 */
export interface BusinessSideRecipients {
  /** business_accounts.business_email. Null when the tenant has none on file. */
  owner: BusinessEmailRecipient | null;
  /** The booking's creator, already deduped against the owner and against the actor. */
  creator: BusinessEmailRecipient | null;
  /** "Booked by Priya Sharma (staff)", for the owner's copy. Null when the owner booked. */
  bookedBy: string | null;
}

/** A creator as loaded from the database, before any policy is applied. */
export interface BookingCreator {
  /** business_users.id */
  memberId: string;
  /** Already through resolveMemberIdentity, so this is null only if truly unknown. */
  email: string | null;
  name: string | null;
  role: BusinessRole;
  isActive: boolean;
}

/**
 * Load one member as a booking creator, resolving their identity the way the rest of the
 * portal does.
 *
 * Goes through resolveMemberIdentity rather than reading business_users.email directly.
 * That column is nullable and was only backfilled by 20260720_business_staff_users.sql,
 * so a plain read returns null for older rows and those staff would silently receive
 * nothing - no error, no log, just no mail. The fallback chain is the difference between
 * this feature working and appearing to work.
 */
export async function loadBookingCreatorById(
  createdByUserId: string | null
): Promise<BookingCreator | null> {
  if (!createdByUserId) return null;

  const admin = createAdminClient();

  const { data: member } = await admin
    .from('business_users')
    .select('id, auth_user_id, email, full_name, role, is_active, business_account_id')
    .eq('id', createdByUserId)
    .maybeSingle();

  if (!member) return null;

  // profiles is read with the service-role client for the same reason resolveTeamRoster
  // does: RLS on profiles exposes only the signed-in user's own row, and the person we
  // are resolving is usually not the person making the request.
  const [profileResult, accountResult] = await Promise.all([
    member.auth_user_id
      ? admin
          .from('profiles')
          .select('email, full_name')
          .eq('id', member.auth_user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member.business_account_id
      ? admin
          .from('business_accounts')
          .select('business_email, contact_person_name')
          .eq('id', member.business_account_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profile = profileResult.data as { email: string | null; full_name: string | null } | null;
  const account = accountResult.data as {
    business_email: string | null;
    contact_person_name: string | null;
  } | null;

  const identity = resolveMemberIdentity({
    email: member.email,
    full_name: member.full_name,
    role: member.role,
    profileEmail: profile?.email ?? null,
    profileFullName: profile?.full_name ?? null,
    // Gated on the owner role inside resolveMemberIdentity, so passing it for staff is
    // safe: a staff member never inherits the tenant's address as their own.
    accountEmail: account?.business_email ?? null,
    accountContactName: account?.contact_person_name ?? null,
  });

  return {
    memberId: member.id,
    email: identity.email,
    name: identity.full_name,
    role: normalizeBusinessRole(member.role),
    isActive: member.is_active !== false,
  };
}

/**
 * Load a booking's creator when only the booking id is in hand.
 *
 * Two queries. Prefer loadBookingCreatorById wherever created_by_user_id is already
 * selected, which is most call sites, and skip both queries entirely on the booking
 * wizard path where the creator is the authenticated caller.
 */
export async function loadBookingCreator(bookingId: string): Promise<BookingCreator | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('business_bookings')
    .select('created_by_user_id')
    .eq('id', bookingId)
    .maybeSingle();

  return loadBookingCreatorById(data?.created_by_user_id ?? null);
}

/** Case-insensitive address comparison, tolerant of the padding a pasted address carries. */
function sameAddress(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Apply the recipient policy to a booking's owner and creator.
 *
 * The order of these rules matters and is pinned by tests/business/email-recipients.test.ts:
 *
 * 1. No creator recorded - ON DELETE SET NULL fires when a team member is removed, so
 *    this is the normal state of an ex-colleague's bookings, not a corruption.
 * 2. The creator is the owner. Checked before the address comparison because
 *    resolveMemberIdentity falls back to business_email for owners, so an owner's
 *    resolved address frequently *is* ownerEmail. Both rules would suppress the second
 *    send, but only this one also suppresses the attribution line - telling an owner
 *    "Booked by you" is noise.
 * 3. The creator is the one who just did this. They watched it succeed on screen; mailing
 *    them about their own click is how an inbox stops being read.
 * 4. Deactivated. Nothing in the schema stops mailing someone removed from the team
 *    yesterday, so this rule is load-bearing rather than defensive.
 * 5. No resolvable address, after the full fallback chain.
 * 6. Same mailbox as the owner. The surviving copy is the owner's, which carries the
 *    wallet balance - correct, because the address is the tenant's own.
 *
 * Rules 3 to 6 keep `bookedBy`: the owner should still learn who made the booking even
 * when the creator themselves is not written to.
 */
export function buildBusinessSideRecipients(input: {
  ownerEmail: string | null;
  ownerName: string | null;
  creator: BookingCreator | null;
  /** business_users.id of whoever performed this action, when it is known. */
  actorMemberId?: string | null;
}): BusinessSideRecipients {
  const { ownerEmail, ownerName, creator, actorMemberId } = input;

  const owner: BusinessEmailRecipient | null = ownerEmail
    ? { memberId: null, email: ownerEmail, name: ownerName, role: 'owner' }
    : null;

  if (!creator) {
    return { owner, creator: null, bookedBy: null };
  }

  if (creator.role === 'owner') {
    return { owner, creator: null, bookedBy: null };
  }

  const bookedBy = `Booked by ${creator.name || creator.email || 'a team member'} (staff)`;

  const suppressed =
    (actorMemberId != null && actorMemberId === creator.memberId) ||
    !creator.isActive ||
    !creator.email ||
    sameAddress(creator.email, ownerEmail);

  if (suppressed) {
    return { owner, creator: null, bookedBy };
  }

  return {
    owner,
    creator: {
      memberId: creator.memberId,
      // Narrowed by the !creator.email check above.
      email: creator.email as string,
      name: creator.name,
      role: creator.role,
    },
    bookedBy,
  };
}

/**
 * Whether a status change is worth mailing the creator about.
 *
 * sendBusinessBookingStatusUpdateEmail serves every status in the system, including
 * 'completed' from the vendor completion path. Without this predicate, wiring the creator
 * into that one sender would quietly subscribe staff to the two statuses they were
 * deliberately excluded from.
 *
 * 'confirmed' means transport is secured, which changes what staff tell the guest.
 * 'in_progress' and 'completed' are closure - the portal and the notification bell carry
 * them, and an inbox does not need to.
 */
export function creatorWantsStatus(newStatus: string): boolean {
  return newStatus === 'confirmed';
}
