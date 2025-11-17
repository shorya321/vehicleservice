/**
 * Business Account Signup API
 * Creates new business account with auth user
 */

import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import {
  businessRegistrationSchema,
  type BusinessRegistrationInput,
} from '@/lib/business/validators';
import { generateSubdomain, isValidSubdomain } from '@/lib/business/domain-utils';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';

/**
 * POST /api/business/auth/signup
 * Register new business account
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  const validationResult = businessRegistrationSchema.safeParse(body);

  if (!validationResult.success) {
    return apiError('Invalid input: ' + validationResult.error.errors[0].message, 400);
  }

  const data: BusinessRegistrationInput = validationResult.data;

  // Generate subdomain from business name
  const subdomain = generateSubdomain(data.business_name);

  // Validate subdomain
  if (!isValidSubdomain(subdomain)) {
    return apiError('Invalid business name - cannot generate valid subdomain', 400);
  }

  // Use admin client to create user and business account
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Check if subdomain already exists
  const { data: existingSubdomain } = await supabaseAdmin
    .from('business_accounts')
    .select('id')
    .eq('subdomain', subdomain)
    .single();

  if (existingSubdomain) {
    return apiError('Business name already taken - subdomain exists', 409);
  }

  // Check if email already exists
  const { data: existingEmail } = await supabaseAdmin
    .from('business_accounts')
    .select('id')
    .eq('business_email', data.business_email)
    .single();

  if (existingEmail) {
    return apiError('Business email already registered', 409);
  }

  // Create Supabase auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.business_email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      business_name: data.business_name,
      contact_person_name: data.contact_person_name,
      user_type: 'business', // Set user_type for trigger to create profile with role='business'
    },
  });

  if (authError || !authUser.user) {
    console.error('Auth user creation failed:', authError);
    return apiError('Failed to create account: ' + authError?.message, 500);
  }

  try {
    // Create business account
    const { data: businessAccount, error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .insert({
        business_name: data.business_name,
        business_email: data.business_email,
        business_phone: data.business_phone,
        contact_person_name: data.contact_person_name,
        address: data.address || null,
        city: data.city || null,
        country_code: data.country_code || null,
        subdomain,
        wallet_balance: 0.0,
        status: 'active',
      })
      .select()
      .single();

    if (businessError || !businessAccount) {
      // Rollback: Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.error('Business account creation failed:', businessError);
      return apiError('Failed to create business account', 500);
    }

    // Create business user (link auth user to business account)
    const { error: businessUserError } = await supabaseAdmin.from('business_users').insert({
      business_account_id: businessAccount.id,
      auth_user_id: authUser.user.id,
      role: 'owner',
    });

    if (businessUserError) {
      // Rollback: Delete auth user and business account
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from('business_accounts').delete().eq('id', businessAccount.id);
      console.error('Business user creation failed:', businessUserError);
      return apiError('Failed to link user to business account', 500);
    }

    // Success - try to sign in the user automatically
    try {
      const supabase = await createSupabaseClient();
      await supabase.auth.signInWithPassword({
        email: data.business_email,
        password: data.password,
      });
    } catch (signInError) {
      // Sign-in failed, but account creation was successful
      // User can sign in manually
      console.error('Auto sign-in failed (account created successfully):', signInError);
    }

    return apiSuccess(
      {
        business_id: businessAccount.id,
        subdomain: businessAccount.subdomain,
        business_name: businessAccount.business_name,
      },
      201
    );
  } catch (error) {
    // Rollback: Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    console.error('Signup error:', error);
    return apiError('Registration failed', 500);
  }
});
