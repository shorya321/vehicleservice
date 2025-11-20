/**
 * Business Account Login API
 * Authenticates business users
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

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
    await supabase.auth.signOut();
    return apiError('Your account has been deactivated', 403);
  }

  // Check business account status and provide specific error messages
  const accountStatus = businessUser.business_accounts.status;

  if (accountStatus !== 'active') {
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

  // Determine domain type
  const isCustomDomain = hostname !== platformDomain &&
                         !hostname.endsWith(`.${platformDomain}`) &&
                         !hostname.startsWith(`${platformDomain}:`);

  const isSubdomain = !isCustomDomain &&
                      hostname !== platformDomain &&
                      hostname.endsWith(`.${platformDomain}`);

  // Validate custom domain ownership
  if (isCustomDomain) {
    console.log('Validating custom domain ownership:', { hostname, businessId: businessUser.business_account_id });

    const { data: domainOwner, error: domainError } = await supabase
      .rpc('get_business_by_custom_domain', { p_domain: hostname });

    if (domainError) {
      console.error('Error checking domain ownership:', domainError);
      await supabase.auth.signOut();
      return apiError('Unable to verify domain ownership', 500);
    }

    if (!domainOwner || domainOwner.length === 0) {
      console.warn('Custom domain not found in database:', hostname);
      await supabase.auth.signOut();
      return apiError('This custom domain is not registered', 403);
    }

    const ownerBusinessId = domainOwner[0].id;

    if (businessUser.business_account_id !== ownerBusinessId) {
      console.warn('Domain ownership mismatch:', {
        hostname,
        ownerBusinessId,
        userBusinessId: businessUser.business_account_id,
      });
      await supabase.auth.signOut();
      return apiError('This domain belongs to another business. Please use your own business portal to log in.', 403);
    }

    console.log('Custom domain ownership verified:', hostname);
  }

  // Validate subdomain ownership
  if (isSubdomain) {
    // Extract subdomain (first part before first dot)
    const subdomain = hostname.split('.')[0];
    const userBusinessSubdomain = businessUser.business_accounts.subdomain;

    console.log('Validating subdomain ownership:', {
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
  }

  // Main platform: no validation needed (open access for all businesses)
  if (!isCustomDomain && !isSubdomain) {
    console.log('Login via main platform - no domain validation required');
  }

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
