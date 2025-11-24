import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Business Reset Password API
 *
 * Validates token and updates user password securely.
 * CRITICAL SECURITY: Validates token ownership and domain context.
 *
 * Flow:
 * 1. Validate token exists and not expired/used
 * 2. Verify domain context matches token
 * 3. Update password using admin client (bypass RLS)
 * 4. Mark token as used
 * 5. Return success
 */

const resetPasswordSchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ResetPasswordInput = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Get hostname from request headers
    const hostname = request.headers.get('host') || '';

    // Initialize Supabase client
    const supabase = await createClient();

    // STEP 1: Fetch token from database
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, email, business_account_id, domain, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    // STEP 2: Validate token is not expired (1 hour expiry)
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // STEP 3: Validate token hasn't been used
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'This reset token has already been used. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // STEP 4: Verify domain context matches (CRITICAL SECURITY CHECK)
    // Token domain should match current request domain
    if (resetToken.domain !== hostname) {
      console.warn('Domain mismatch:', {
        tokenDomain: resetToken.domain,
        requestDomain: hostname,
      });
      return NextResponse.json(
        { error: 'Invalid request. Please use the original reset link sent to your email.' },
        { status: 403 }
      );
    }

    // STEP 5: Get business user's auth_user_id using database function
    const { data: businessUserResult, error: businessUserError } = await supabase
      .rpc('get_business_user_by_email', { p_email: resetToken.email });

    if (businessUserError || !businessUserResult || businessUserResult.length === 0) {
      console.error('Business user not found:', businessUserError);
      return NextResponse.json(
        { error: 'User account not found or inactive.' },
        { status: 404 }
      );
    }

    // Verify the business account matches the token
    if (businessUserResult[0].business_account_id !== resetToken.business_account_id) {
      console.error('Business account mismatch');
      return NextResponse.json(
        { error: 'User account not found or inactive.' },
        { status: 404 }
      );
    }

    const businessUser = {
      auth_user_id: businessUserResult[0].auth_user_id
    };

    // STEP 6: Update password using Supabase Admin client (bypass RLS)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      businessUser.auth_user_id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // STEP 7: Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError);
      // Don't fail the request - password was updated successfully
    }

    return NextResponse.json(
      { message: 'Password updated successfully.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
