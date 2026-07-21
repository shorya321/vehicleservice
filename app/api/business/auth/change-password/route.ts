/**
 * Business Change Password API
 * POST: the signed-in member changes their OWN password.
 *
 * Available to owners and staff alike. Sits with the other auth routes rather
 * than under /api/business/team because it is never about another member.
 */

import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createIsolatedClient } from '@supabase/supabase-js';
import { changePasswordSchema } from '@/lib/business/validators';
import { checkAttempt, resetAttempts } from '@/lib/business/rate-limit';

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export const POST = requireBusinessAuth(async (request: Request, user) => {
  const body = await parseRequestBody(request, changePasswordSchema);

  if (!body) {
    return apiError('Password must be at least 8 characters and differ from your current one', 400);
  }

  const supabase = await createClient();

  // The member's own login email. NOT user.businessEmail - that is
  // business_accounts.business_email, which staff do not sign in with.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return apiError('Unable to verify your account', 401);
  }

  // A live session cookie plus this endpoint is a password-guessing oracle,
  // so throttle before doing any verification work.
  const limit = checkAttempt(`change-password:${user.userId}`, {
    max: MAX_ATTEMPTS,
    windowMs: ATTEMPT_WINDOW_MS,
  });

  if (!limit.allowed) {
    return apiError(
      `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
      429
    );
  }

  // Verify the CURRENT password. Without this, any borrowed session becomes a
  // permanent account takeover.
  //
  // signInWithPassword is the only real re-authentication primitive Supabase
  // exposes - auth.users.encrypted_password is not readable via PostgREST, so
  // a direct compare is impossible.
  //
  // It runs on a throwaway client because lib/supabase/server.ts createClient
  // is React-cache()d and writes cookies through setAll; verifying on it would
  // rotate the caller's own session mid-request and leave the cookie jar
  // inconsistent if verification then failed.
  const verifier = createIsolatedClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: authUser.email,
    password: body.current_password,
  });

  if (verifyError) {
    // Never log the error object here - it can echo credential material.
    console.error('change-password: current password verification failed', {
      userId: user.userId,
    });
    return apiError('Current password is incorrect', 400);
  }

  // Apply on the cookie-bound session client. updateUser takes no user id, so
  // it is structurally impossible for this route to change anyone else's
  // password, and it refreshes the caller's session in place.
  const { error: updateError } = await supabase.auth.updateUser({
    password: body.new_password,
  });

  if (updateError) {
    console.error('change-password: update failed', { userId: user.userId });
    return apiError('Failed to update your password', 500);
  }

  resetAttempts(`change-password:${user.userId}`);

  // Supabase does not revoke other refresh tokens on a password change, and
  // "someone may have my password" is the main reason this endpoint exists.
  // The caller's own session survives because updateUser refreshed it above.
  try {
    await createAdminClient().auth.admin.signOut(user.userId, 'others');
  } catch {
    // Best-effort. The password is already changed; failing here would be
    // a worse outcome than leaving another session alive until it expires.
    console.error('change-password: failed to revoke other sessions', {
      userId: user.userId,
    });
  }

  return apiSuccess({
    message: 'Password updated. You have been signed out on other devices.',
  });
});
