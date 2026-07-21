'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { memberProfileUpdateSchema } from '@/lib/business/validators';
import { getBusinessMember } from '@/lib/business/member-scope';
import { revalidatePath } from 'next/cache';

/**
 * Update the signed-in member's own display name.
 *
 * Writes both `business_users.full_name` (the portal's display name - per
 * member, tenant-scoped, and what /business/team renders) and
 * `profiles.full_name` (the platform-wide identity that notification triggers
 * read). Letting those two drift is how a booking email ends up addressed to
 * someone's old name.
 *
 * Deliberately does NOT touch business_accounts.contact_person_name - that is
 * business-level and stays behind requireBusinessOwner on
 * PUT /api/business/profile.
 */
export async function updateMemberDisplayName(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Resolve the member from the session. Never accept a member id from the form.
  const member = await getBusinessMember(supabase, user.id);

  if (!member) {
    return { error: 'Unauthorized' };
  }

  const parsed = memberProfileUpdateSchema.safeParse({
    full_name: formData.get('full_name'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid name' };
  }

  const { full_name } = parsed.data;

  // business_users has no UPDATE policy for business users, so this needs the
  // service-role client. Scope by auth_user_id - the session's own identity.
  const adminClient = createAdminClient();

  const { error: memberError } = await adminClient
    .from('business_users')
    .update({ full_name })
    .eq('auth_user_id', user.id);

  if (memberError) {
    console.error('Failed to update member display name:', memberError);
    return { error: 'Failed to update your name' };
  }

  // Session client: profiles has a "Users can update own profile" policy, so
  // RLS enforces ownership here as a second layer. Best-effort - an older
  // member may have no profiles row, and that should not fail the request.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (profileError) {
    console.error('Failed to sync profiles.full_name:', profileError);
  }

  // The name renders in the portal header, which lives in the layout.
  revalidatePath('/business', 'layout');
  revalidatePath('/business/profile');

  return {};
}
