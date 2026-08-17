/**
 * Business account approval and rejection, in one place.
 *
 * Server only. Everything here talks to the service-role client, so importing it
 * from a client component would be a real leak. `server-only` is not a dependency
 * of this project, so the guard below is the equivalent.
 *
 * Why this module exists: approval used to live in two places that disagreed. The
 * detail page called PUT /api/admin/businesses/[id]/approve, which sent the owner
 * their "you have been approved" email. The businesses *list* - the surface that
 * carries the "Action needed" count, so the one an admin actually clicks - called a
 * server action that did a bare status UPDATE and told nobody. The one real approval
 * on production went out through the list, and the owner was never emailed.
 *
 * Every admin surface now routes through here, so the two paths cannot drift again.
 *
 * This module is deliberately NOT a 'use server' module. A type exported from one of
 * those breaks at runtime while tsc stays silent.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'lib/business/admin/account-status.ts is server only and must not be imported from a client component'
  );
}

import { createAdminClient } from '@/lib/supabase/admin';
import {
  sendBusinessApprovalEmail,
  sendBusinessRejectionEmail,
} from '@/lib/business/email/services/business-emails';

export interface BusinessTransitionResult {
  success: boolean;
  error?: string;
  businessName?: string;
  /**
   * `false` means the status changed but the owner was not reached. Callers must
   * surface that rather than reporting a plain success: a silent mail failure is
   * exactly how the original bug stayed invisible.
   *
   * Absent when the transition itself failed, since no send was attempted.
   */
  emailDelivered?: boolean;
}

type AdminClient = ReturnType<typeof createAdminClient>;

interface ClaimedAccount {
  business_name: string;
  business_email: string;
  contact_person_name: string | null;
}

/**
 * Flip a pending account to its next status, and return it only if this call is the
 * one that did it.
 *
 * The `status = 'pending'` predicate lives in the UPDATE rather than in a preceding
 * SELECT so two admins clicking Approve at the same moment cannot both win: the
 * loser matches no row and is told the account is no longer pending, instead of
 * sending a second copy of the email.
 */
async function claimPendingAccount(
  admin: AdminClient,
  businessId: string,
  nextStatus: 'active' | 'rejected',
  verb: 'approve' | 'reject'
): Promise<{ business?: ClaimedAccount; error?: string }> {
  // Both forms are spelled out rather than built as `${verb}ed`, which yields
  // "approveed" and "rejecteed" - and these strings are shown to the admin.
  const pastTense = verb === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await admin
    .from('business_accounts')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .eq('status', 'pending')
    .select('business_name, business_email, contact_person_name')
    .maybeSingle();

  if (error) {
    console.error(`Business ${verb} update error:`, error);
    return { error: `Failed to ${verb} business account` };
  }

  if (!data) {
    // No row matched. Either the id is wrong or somebody moved it off pending
    // first, and those deserve different messages.
    const { data: existing } = await admin
      .from('business_accounts')
      .select('status')
      .eq('id', businessId)
      .maybeSingle();

    if (!existing) {
      return { error: 'Business account not found' };
    }

    return {
      error: `Cannot ${verb} business with status '${existing.status}'. Only pending businesses can be ${pastTense}.`,
    };
  }

  return { business: data };
}

/**
 * The name the owner is addressed by.
 *
 * `business_users.full_name` is the preferred source but is frequently NULL: signup
 * used to insert only the account link and the role, leaving name and email empty.
 * `business_accounts.contact_person_name` is what the applicant actually typed, and
 * has been sitting there the whole time. Without this fallback the approval email
 * greets a real person as "Business Owner".
 */
async function resolveOwnerName(
  admin: AdminClient,
  businessId: string,
  contactPersonName: string | null
): Promise<string> {
  const { data: ownerUser } = await admin
    .from('business_users')
    .select('full_name')
    .eq('business_account_id', businessId)
    .eq('role', 'owner')
    .maybeSingle();

  return ownerUser?.full_name || contactPersonName || 'Business Owner';
}

/**
 * Approve a pending business account and tell the owner.
 *
 * Never throws, and a mail failure never rolls the approval back: the account is
 * live either way, and refusing the approval over an SMTP hiccup would be worse
 * than an unsent notification we report honestly.
 */
export async function approveBusinessAccount(
  businessId: string
): Promise<BusinessTransitionResult> {
  const admin = createAdminClient();

  const { business, error } = await claimPendingAccount(admin, businessId, 'active', 'approve');

  if (!business) {
    return { success: false, error };
  }

  const ownerName = await resolveOwnerName(admin, businessId, business.contact_person_name);

  // Always link to the main platform domain: tenant subdomains and custom domains
  // are not provisioned yet at approval time.
  const platformDomain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  const emailResult = await sendBusinessApprovalEmail({
    email: business.business_email,
    businessName: business.business_name,
    ownerName,
    loginUrl: `${platformDomain}/business/login`,
  });

  if (!emailResult.success) {
    console.error('Failed to send business approval email:', emailResult.error);
  }

  return {
    success: true,
    businessName: business.business_name,
    emailDelivered: emailResult.success,
  };
}

/**
 * Reject a pending business account and tell the applicant.
 *
 * `supportEmail` is deliberately not passed: the template's own default is the real
 * support address, and the call site that used to override it pointed at a domain
 * this product does not own.
 */
export async function rejectBusinessAccount(
  businessId: string,
  reason?: string
): Promise<BusinessTransitionResult> {
  const admin = createAdminClient();

  const { business, error } = await claimPendingAccount(admin, businessId, 'rejected', 'reject');

  if (!business) {
    return { success: false, error };
  }

  const ownerName = await resolveOwnerName(admin, businessId, business.contact_person_name);

  const emailResult = await sendBusinessRejectionEmail({
    email: business.business_email,
    businessName: business.business_name,
    ownerName,
    reason,
  });

  if (!emailResult.success) {
    console.error('Failed to send business rejection email:', emailResult.error);
  }

  return {
    success: true,
    businessName: business.business_name,
    emailDelivered: emailResult.success,
  };
}
