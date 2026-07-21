/**
 * Helpers for scoping business portal data to the signed-in member.
 *
 * A business account has one owner plus any number of staff members. Owners see
 * everything the business has; staff see only the bookings they created
 * themselves, which is tracked by business_bookings.created_by_user_id.
 */

import type { BusinessRole } from './roles';
import { normalizeBusinessRole } from './roles';

export interface BusinessMember {
  /** business_users.id - this is what created_by_user_id points at, NOT auth.users.id */
  id: string;
  businessAccountId: string;
  role: BusinessRole;
}

/**
 * True when this member may only see the bookings they created.
 */
export function restrictedToOwnBookings(role: BusinessRole): boolean {
  return role !== 'owner';
}

/**
 * Resolve the signed-in member for a business portal page.
 *
 * Returns null when the user is not a business member, is deactivated, or their
 * business account is not active - callers should redirect to /business/login.
 *
 * @param supabase - server Supabase client for the current request
 * @param authUserId - auth.users.id of the signed-in user
 */
export async function getBusinessMember(
  supabase: {
    from: (table: string) => any;
  },
  authUserId: string
): Promise<BusinessMember | null> {
  const { data, error } = await supabase
    .from('business_users')
    .select('id, business_account_id, role, is_active, business_accounts (status)')
    .eq('auth_user_id', authUserId)
    .single();

  if (error || !data || !data.is_active) {
    return null;
  }

  const account = Array.isArray(data.business_accounts)
    ? data.business_accounts[0]
    : data.business_accounts;

  if (!account || account.status !== 'active') {
    return null;
  }

  return {
    id: data.id,
    businessAccountId: data.business_account_id,
    role: normalizeBusinessRole(data.role),
  };
}
