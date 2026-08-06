/**
 * Business Account Logout API
 * Signs out authenticated business user
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { getBusinessMember } from '@/lib/business/member-scope';
import { logBusinessActivity } from '@/lib/business/activity/log';

/**
 * POST /api/business/auth/logout
 * Sign out current user
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  // Resolve the member BEFORE signing out: afterwards auth.getUser() returns
  // nothing and the row could not be attributed to anyone.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const member = authUser ? await getBusinessMember(supabase, authUser.id) : null;

  const { error } = await supabase.auth.signOut();

  if (error) {
    return apiError('Logout failed', 500);
  }

  if (member) {
    await logBusinessActivity({
      businessAccountId: member.businessAccountId,
      action: 'security.logout',
      actor: {
        type: 'business_user',
        name: member.name || member.email || authUser?.email || 'A team member',
        authUserId: member.authUserId,
        businessUserId: member.id,
        role: member.role,
        email: member.email ?? authUser?.email ?? null,
      },
      request,
    });
  }

  return apiSuccess({ message: 'Logged out successfully' });
});
