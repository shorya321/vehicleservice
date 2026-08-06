/**
 * Manual activity purge.
 *
 * The owner clears history older than a cutoff they choose. There is no
 * automatic retention job: keeping or removing this history is the owner's
 * call, not a background timer's.
 *
 * Authorization is enforced twice. requireBusinessOwner gates the route, and
 * purge_business_activity independently re-checks that auth.uid() is an active
 * owner of the account it was handed. That second check matters because the
 * function is SECURITY DEFINER and therefore bypasses RLS.
 *
 * The purge always leaves an activity.purged row recording the cutoff and how
 * many entries were removed. History can be cleared, but never silently.
 */


import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  requireBusinessOwner,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';

const purgeSchema = z.object({
  before: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO date')),
});

export const POST = requireBusinessOwner(async (request: Request, user) => {
  const body = await parseRequestBody(request, purgeSchema);

  if (!body) {
    return apiError('A valid cutoff date is required', 400);
  }

  const before = new Date(body.before);

  if (Number.isNaN(before.getTime())) {
    return apiError('A valid cutoff date is required', 400);
  }

  if (before.getTime() > Date.now()) {
    return apiError('The cutoff date cannot be in the future', 400);
  }

  try {
    // The session client, not the admin client: the function reads auth.uid()
    // to verify ownership, and a service-role call has no auth.uid() at all.
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('purge_business_activity', {
      p_business_account_id: user.businessAccountId,
      p_before: before.toISOString(),
    });

    if (error) {
      console.error('Activity purge failed:', error);
      return apiError('Failed to clear activity history', 500);
    }

    return apiSuccess({
      deleted: data ?? 0,
      message: `Cleared ${data ?? 0} activity entries.`,
    });
  } catch (error) {
    console.error('Activity purge error:', error);
    return apiError('Failed to clear activity history', 500);
  }
});
