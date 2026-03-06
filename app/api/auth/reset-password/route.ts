import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    const supabaseAdmin = createAdminClient();

    // Fetch token from database
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, email, expires_at, used_at')
      .eq('token', token)
      .is('business_account_id', null)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    // Validate token is not expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // Validate token hasn't been used
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'This reset token has already been used. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError || !users) {
      return NextResponse.json(
        { error: 'Failed to verify user account.' },
        { status: 500 }
      );
    }

    const user = users.find((u) => u.email === resetToken.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

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
