import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email/services/auth-emails';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const supabaseAdmin = createAdminClient();

    // Look up user by email to get their name
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    let userName = 'User';
    let userId: string | null = null;

    if (!userError && users) {
      const user = users.find((u) => u.email === email);
      if (user) {
        userId = user.id;
        const meta = user.user_metadata;
        userName = meta?.first_name
          ? `${meta.first_name}${meta.last_name ? ` ${meta.last_name}` : ''}`
          : meta?.name || 'User';
      }
    }

    // If user not found, return generic success (don't reveal if email exists)
    if (!userId) {
      return NextResponse.json(
        { message: 'If this email is registered, you will receive a password reset link.' },
        { status: 200 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database (business_account_id = null for frontend users)
    const hostname = request.headers.get('host') || '';
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        email,
        token,
        domain: hostname,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to process password reset request. Please try again.' },
        { status: 500 }
      );
    }

    // Build reset URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://${hostname}`;
    const resetLink = `${siteUrl}/reset-password?token=${token}`;

    // Send styled email
    const emailResult = await sendPasswordResetEmail({
      email,
      name: userName,
      resetUrl: resetLink,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    return NextResponse.json(
      { message: 'If this email is registered, you will receive a password reset link.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
