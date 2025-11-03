/**
 * Business Account Logout API
 * Signs out authenticated business user
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';

/**
 * POST /api/business/auth/logout
 * Sign out current user
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return apiError('Logout failed', 500);
  }

  return apiSuccess({ message: 'Logged out successfully' });
});
