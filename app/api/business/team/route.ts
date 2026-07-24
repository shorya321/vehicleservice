/**
 * Business Team API
 * Lets a business owner manage the staff members who book on their behalf.
 *
 * All handlers are owner-only. Writes go through the service-role client
 * because business_users has no INSERT policy for business users - which also
 * means RLS protects nothing here, so every handler derives the tenant from the
 * session and re-checks it against the target row before writing.
 */


import {
  requireBusinessOwner,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  teamMemberCreateSchema,
  teamMemberUpdateSchema,
  teamMemberDeleteSchema,
} from '@/lib/business/validators';

/**
 * GET /api/business/team
 * List the members of the signed-in owner's business account.
 */
export const GET = requireBusinessOwner(async (_request: Request, user) => {
  const adminClient = createAdminClient();

  const { data: members, error } = await adminClient
    .from('business_users')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('business_account_id', user.businessAccountId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load business team members:', error);
    return apiError('Failed to load team members', 500);
  }

  return apiSuccess({ members: members ?? [] });
});

/**
 * POST /api/business/team
 * Create a staff member under the signed-in owner's business account.
 */
export const POST = requireBusinessOwner(async (request: Request, user) => {
  const body = await parseRequestBody(request, teamMemberCreateSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  const email = body.email.trim().toLowerCase();
  const adminClient = createAdminClient();

  // business_users.auth_user_id is UNIQUE, so one person can belong to exactly
  // one business platform-wide. Reject an email that already exists anywhere
  // rather than trying to attach it: linking would mean flipping profiles.role,
  // which breaks that person's existing customer/vendor views and their
  // proxy.ts routing. A staff email must be unused across the platform.
  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (profileLookupError) {
    console.error('Failed to check existing profile:', profileLookupError);
    return apiError('Failed to verify the email address', 500);
  }

  if (existingProfile) {
    return apiError(
      'This email is already registered on the platform. Please use a different address.',
      409
    );
  }

  // Resolve the password. The dynamic import keeps the generator server-only.
  let password = body.password;

  if (body.password_option === 'generate') {
    const { generateSecurePassword } = await import('@/lib/utils/password');
    password = generateSecurePassword(12);
  }

  if (!password) {
    return apiError('Password is required', 400);
  }

  // user_type: 'business' is essential - handle_new_user() reads it to set
  // profiles.role. Without it the member gets role='customer' and can never
  // sign in to the business portal.
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: body.full_name,
      user_type: 'business',
    },
  });

  if (authError || !authData?.user) {
    console.error('Failed to create staff auth user:', authError);

    if (authError?.message?.toLowerCase().includes('already')) {
      return apiError(
        'This email is already registered on the platform. Please use a different address.',
        409
      );
    }

    return apiError('Failed to create the staff account', 500);
  }

  const { data: member, error: memberError } = await adminClient
    .from('business_users')
    .insert({
      business_account_id: user.businessAccountId,
      auth_user_id: authData.user.id,
      role: 'staff',
      email,
      full_name: body.full_name,
      is_active: true,
    })
    .select('id, email, full_name, role, is_active, created_at')
    .single();

  if (memberError || !member) {
    // Roll the auth user back so a failed insert doesn't strand an orphan login.
    await adminClient.auth.admin.deleteUser(authData.user.id);
    console.error('Failed to create business_users row:', memberError);
    return apiError('Failed to add the staff member', 500);
  }

  // The handle_new_user trigger never sets profiles.email_verified, so staff show
  // as unverified in the admin UI despite email_confirm being true. Mark verified.
  // Non-fatal: the staff account is already created and linked. (full_name is set
  // by the trigger from body.full_name metadata; staff have no phone field.)
  const { error: staffProfileError } = await adminClient
    .from('profiles')
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', authData.user.id);

  if (staffProfileError) {
    console.error('Failed to mark staff profile verified:', staffProfileError);
  }

  return apiSuccess(
    {
      member,
      // Returned once so the owner can hand it over. Never stored in plaintext.
      temporaryPassword: body.password_option === 'generate' ? password : undefined,
    },
    201
  );
});

/**
 * PATCH /api/business/team
 * Activate or deactivate a staff member.
 *
 * Deactivation is the right tool for someone who has left: they lose access
 * immediately, but their bookings keep pointing at who created them and the
 * roster stays auditable. DELETE below is the other half of the pair - it
 * erases someone added by mistake, and refuses anyone with booking history
 * precisely so that attribution is never lost this way.
 */
export const PATCH = requireBusinessOwner(async (request: Request, user) => {
  const body = await parseRequestBody(request, teamMemberUpdateSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  const adminClient = createAdminClient();

  // Re-fetch the target and confirm it belongs to this tenant. The service-role
  // client bypasses RLS, so without this an owner could toggle another
  // business's staff member by guessing a UUID.
  const { data: target, error: targetError } = await adminClient
    .from('business_users')
    .select('id, business_account_id, role')
    .eq('id', body.member_id)
    .maybeSingle();

  if (targetError) {
    console.error('Failed to load target team member:', targetError);
    return apiError('Failed to update the team member', 500);
  }

  if (!target || target.business_account_id !== user.businessAccountId) {
    return apiError('Team member not found', 404);
  }

  if (target.role === 'owner') {
    return apiError('The account owner cannot be deactivated', 403);
  }

  if (target.id === user.businessId) {
    return apiError('You cannot change your own access', 403);
  }

  const { data: member, error: updateError } = await adminClient
    .from('business_users')
    .update({ is_active: body.is_active })
    .eq('id', target.id)
    .eq('business_account_id', user.businessAccountId)
    .select('id, email, full_name, role, is_active, created_at')
    .single();

  if (updateError || !member) {
    console.error('Failed to update team member:', updateError);
    return apiError('Failed to update the team member', 500);
  }

  return apiSuccess({ member });
});

/**
 * DELETE /api/business/team?member_id=<uuid>
 * Permanently remove a staff member the owner added.
 *
 * Deleting the auth user is the whole operation: business_users.auth_user_id
 * and profiles.id are both ON DELETE CASCADE, so one call removes the login,
 * the profile and the membership together. Removing only the business_users row
 * would leave the profile behind, and the POST duplicate-email check above
 * would then reject that address forever, on any business.
 *
 * Members who have created bookings are refused - deactivate them instead. That
 * keeps business_bookings.created_by_user_id ON DELETE SET NULL as a safety net
 * rather than a routine outcome.
 *
 * Known narrow race: the member could create a booking between the count below
 * and the delete. Worst case that one booking loses its creator, which is the
 * behaviour the FK already defines.
 *
 * member_id travels in the query string - the convention for DELETE elsewhere
 * in this API - and is validated rather than trusted.
 */
export const DELETE = requireBusinessOwner(async (request: Request, user) => {
  const memberId = new URL(request.url).searchParams.get('member_id');
  const parsed = teamMemberDeleteSchema.safeParse({ member_id: memberId });

  if (!parsed.success) {
    return apiError('Invalid member id', 400);
  }

  const adminClient = createAdminClient();

  // Re-fetch the target and confirm it belongs to this tenant. The service-role
  // client bypasses RLS, so without this an owner could delete another
  // business's staff member by guessing a UUID.
  const { data: target, error: targetError } = await adminClient
    .from('business_users')
    .select('id, business_account_id, role, auth_user_id, email, full_name')
    .eq('id', parsed.data.member_id)
    .maybeSingle();

  if (targetError) {
    console.error('Failed to load target team member:', targetError);
    return apiError('Failed to remove the team member', 500);
  }

  // Same 404 for "does not exist" and "belongs to someone else", so this can't
  // be used to probe for member ids across tenants.
  if (!target || target.business_account_id !== user.businessAccountId) {
    return apiError('Team member not found', 404);
  }

  if (target.role === 'owner') {
    return apiError('The account owner cannot be removed', 403);
  }

  if (target.id === user.businessId) {
    return apiError('You cannot remove your own access', 403);
  }

  const { count, error: countError } = await adminClient
    .from('business_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('created_by_user_id', target.id);

  if (countError) {
    console.error('Failed to count team member bookings:', countError);
    return apiError('Failed to remove the team member', 500);
  }

  if ((count ?? 0) > 0) {
    return apiError(
      `This member has ${count} booking(s). Deactivate them instead so their booking history keeps its attribution.`,
      409
    );
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(target.auth_user_id);

  if (deleteError) {
    console.error('Failed to delete staff auth user:', deleteError);
    return apiError('Failed to remove the team member', 500);
  }

  return apiSuccess({ id: target.id });
});
