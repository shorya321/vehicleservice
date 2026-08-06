/**
 * Business Account Login API
 * Authenticates business users
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { logBusinessActivity } from '@/lib/business/activity/log';
import { maskEmail } from '@/lib/business/activity/mask';
import type { BusinessActivityAction } from '@/lib/business/activity/catalog';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Record a sign in attempt that never reached a session.
 *
 * The tenant is resolved from the email so the owner can see attempts against
 * their account. This must never change the response or its timing, otherwise
 * the log turns the endpoint into an email enumeration oracle: resolution
 * failure is silent and the caller always returns the same generic error.
 */
async function logFailedAttempt(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  action: BusinessActivityAction,
  reasonCode: string
): Promise<void> {
  try {
    const { data } = await supabase.rpc('get_business_user_by_email', { p_email: email });
    const match = Array.isArray(data) ? data[0] : null;
    if (!match?.business_account_id) return;

    await logBusinessActivity({
      businessAccountId: match.business_account_id,
      action,
      actor: { type: 'business_user', name: 'Unknown', authUserId: match.auth_user_id ?? null },
      request,
      // The attempted password is never recorded, in any form.
      metadata: { email_masked: maskEmail(email), reason_code: reasonCode },
    });
  } catch {
    // A failure here must not affect the sign in response.
  }
}

/**
 * POST /api/business/auth/login
 * Authenticate business user
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  const validationResult = loginSchema.safeParse(body);

  if (!validationResult.success) {
    return apiError('Invalid input: ' + validationResult.error.errors[0].message, 400);
  }

  const { email, password } = validationResult.data;

  let supabase = await createClient();

  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    await logFailedAttempt(request, supabase, email, 'security.login_failed', 'invalid_credentials');
    return apiError('Invalid email or password', 401);
  }

  // Create new client instance to pick up the auth session from cookies
  supabase = await createClient();

  // Verify user is a business user
  const { data: businessUser, error: businessUserError } = await supabase
    .from('business_users')
    .select(
      `
      id,
      business_account_id,
      role,
      is_active,
      business_accounts (
        id,
        business_name,
        subdomain,
        status
      )
    `
    )
    .eq('auth_user_id', authData.user.id)
    .single();

  if (businessUserError || !businessUser) {
    // Not a business user - sign out
    await supabase.auth.signOut();
    console.error('Business user lookup failed:', businessUserError);
    return apiError(
      businessUserError
        ? `Not authorized as business user: ${businessUserError.message}`
        : 'Not authorized as business user',
      403
    );
  }

  // Check if business user is active
  if (!businessUser.is_active) {
    // Higher signal than a mistyped password: a deactivated member is still
    // trying to get in, and the tenant is known for certain here.
    await logBusinessActivity({
      businessAccountId: businessUser.business_account_id,
      action: 'security.login_failed',
      actor: {
        type: 'business_user',
        name: 'Unknown',
        authUserId: authData.user.id,
        businessUserId: businessUser.id,
      },
      request,
      metadata: { email_masked: maskEmail(email), reason_code: 'member_deactivated' },
    });
    await supabase.auth.signOut();
    return apiError('Your account has been deactivated', 403);
  }

  // Check business account status and provide specific error messages
  const accountStatus = businessUser.business_accounts.status;

  if (accountStatus !== 'active') {
    await logBusinessActivity({
      businessAccountId: businessUser.business_account_id,
      action: 'security.login_failed',
      actor: {
        type: 'business_user',
        name: 'Unknown',
        authUserId: authData.user.id,
        businessUserId: businessUser.id,
      },
      request,
      metadata: {
        email_masked: maskEmail(email),
        reason_code: `account_${accountStatus}`,
      },
    });
    await supabase.auth.signOut();

    const statusMessages: Record<string, { message: string; code: number }> = {
      pending: {
        message: 'Your business account is pending approval. Our admin team will review your application shortly. You will receive an email once your account is approved.',
        code: 403,
      },
      rejected: {
        message: 'Your business account application was not approved. Please contact support for more information.',
        code: 403,
      },
      suspended: {
        message: 'Your business account has been suspended. Please contact support to resolve this issue.',
        code: 403,
      },
      inactive: {
        message: 'Your business account is inactive. Please contact support to reactivate your account.',
        code: 403,
      },
    };

    const statusInfo = statusMessages[accountStatus] || {
      message: `Your business account status is ${accountStatus}. Please contact support.`,
      code: 403,
    };

    return apiError(statusInfo.message, statusInfo.code);
  }

  // Domain ownership validation for custom domains and subdomains
  const hostname = request.headers.get('host') || '';
  const platformDomain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').hostname;

  // DEV-ONLY: Allow IP address access for LAN testing (remove before production)
  const hostWithoutPort = hostname.split(':')[0];
  const isDevIpAccess = process.env.NODE_ENV !== 'production' &&
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostWithoutPort);

  // Check if main platform (with or without port number)
  const isMainPlatform = hostname === platformDomain ||
                         hostname.startsWith(`${platformDomain}:`) ||
                         isDevIpAccess;

  // Skip validation for main platform domain (open access for all businesses)
  if (isMainPlatform) {
    console.log('Login via main platform - no domain validation required');
  } else {
    // Check database FIRST: Is this a registered custom domain?
    // Database is source of truth, not string pattern matching
    const { data: domainOwner, error: domainError } = await supabase
      .rpc('get_business_by_custom_domain', { p_domain: hostname });

    if (!domainError && domainOwner && domainOwner.length > 0) {
      // This IS a registered custom domain - validate ownership
      console.log('Custom domain detected:', { hostname, businessId: businessUser.business_account_id });

      const ownerBusinessId = domainOwner[0].id;

      if (businessUser.business_account_id !== ownerBusinessId) {
        console.warn('Custom domain ownership mismatch:', {
          hostname,
          ownerBusinessId,
          userBusinessId: businessUser.business_account_id,
        });
        await supabase.auth.signOut();
        return apiError('This domain belongs to another business. Please use your own business portal to log in.', 403);
      }

      console.log('Custom domain ownership verified:', hostname);
    } else if (hostname.endsWith(`.${platformDomain}`)) {
      // Not a custom domain - check if it's a subdomain pattern
      const subdomain = hostname.split('.')[0];
      const userBusinessSubdomain = businessUser.business_accounts.subdomain;

      console.log('Subdomain detected:', {
        hostname,
        subdomain,
        userBusinessSubdomain,
        businessId: businessUser.business_account_id
      });

      if (subdomain !== userBusinessSubdomain) {
        console.warn('Subdomain ownership mismatch:', {
          hostname,
          requestedSubdomain: subdomain,
          userBusinessSubdomain,
        });
        await supabase.auth.signOut();
        return apiError('You cannot access this business subdomain. Please log in at your own business portal or the main platform.', 403);
      }

      console.log('Subdomain ownership verified:', subdomain);
    } else {
      // Unknown domain type - not custom, not subdomain, not main platform
      console.warn('Unknown domain type:', hostname);
      await supabase.auth.signOut();
      return apiError('Invalid domain for business login', 403);
    }
  }

  // Logged only once every check has passed, so a row here always means a
  // usable session was handed out.
  await logBusinessActivity({
    businessAccountId: businessUser.business_account_id,
    action: 'security.login_succeeded',
    actor: {
      type: 'business_user',
      name: authData.user.user_metadata?.full_name || authData.user.email || 'A team member',
      authUserId: authData.user.id,
      businessUserId: businessUser.id,
      role: businessUser.role,
      email: authData.user.email ?? null,
    },
    request,
    metadata: { email_masked: maskEmail(authData.user.email) },
  });

  return apiSuccess({
    user: {
      id: authData.user.id,
      email: authData.user.email,
    },
    business: {
      id: businessUser.business_accounts.id,
      name: businessUser.business_accounts.business_name,
      subdomain: businessUser.business_accounts.subdomain,
      role: businessUser.role,
    },
  });
});
