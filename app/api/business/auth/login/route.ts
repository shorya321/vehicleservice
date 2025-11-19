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
