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

  // Check if business account is active
  if (businessUser.business_accounts.status !== 'active') {
    await supabase.auth.signOut();
    return apiError(
      `Your business account is ${businessUser.business_accounts.status}. Please contact support.`,
      403
    );
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
