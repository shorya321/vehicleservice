import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email/services/auth-emails';

/**
 * Business Forgot Password API
 *
 * Handles password reset requests with domain ownership validation.
 * CRITICAL SECURITY: Prevents cross-business password reset attacks.
 *
 * Flow:
 * 1. Validate domain ownership (email must belong to business owning domain)
 * 2. Generate secure token
 * 3. Store token with domain context
 * 4. Send email with reset link (domain-specific)
 */

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export async function POST(request: NextRequest) {
  try {
    console.log('[FORGOT-PW] Starting forgot password request');

    // Parse request body
    const body: ForgotPasswordInput = await request.json();
    console.log('[FORGOT-PW] Parsed body, email:', body.email);

    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      console.log('[FORGOT-PW] Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Get hostname from request headers
    const hostname = request.headers.get('host') || '';
    const platformDomain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').hostname;
    console.log('[FORGOT-PW] Hostname:', hostname, 'Platform:', platformDomain);

    // Initialize Supabase client
    const supabase = await createClient();
    console.log('[FORGOT-PW] Supabase client initialized');

    // STEP 1: Query which business this email belongs to using database function
    console.log('[FORGOT-PW] Querying business user by email...');
    const { data: emailUserResult, error: emailError } = await supabase
      .rpc('get_business_user_by_email', { p_email: email });

    console.log('[FORGOT-PW] Query result:', {
      hasData: !!emailUserResult,
      resultLength: emailUserResult?.length,
      error: emailError?.message
    });

    if (emailError || !emailUserResult || emailUserResult.length === 0) {
      console.log('[FORGOT-PW] User not found or error:', emailError?.message);
      // For security, return generic message (don't reveal if email exists)
      return NextResponse.json(
        { message: 'If this email is registered, you will receive a password reset link.' },
        { status: 200 }
      );
    }

    // Extract user data from RPC result
    const emailUser = {
      business_account_id: emailUserResult[0].business_account_id,
      business_accounts: {
        subdomain: emailUserResult[0].subdomain,
        custom_domain: emailUserResult[0].custom_domain,
        status: emailUserResult[0].status,
      }
    };

    // Verify business account is active
    if (emailUser.business_accounts?.status !== 'active') {
      console.log('[FORGOT-PW] Business account not active:', emailUser.business_accounts?.status);
      return NextResponse.json(
        { error: 'Business account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    const userBusinessId = emailUser.business_account_id;
    const userSubdomain = emailUser.business_accounts?.subdomain;
    const userCustomDomain = emailUser.business_accounts?.custom_domain;

    console.log('[FORGOT-PW] User business:', {
      userBusinessId,
      userSubdomain,
      userCustomDomain
    });

    // STEP 2: Validate domain ownership (CRITICAL SECURITY CHECK)
    const hostnameWithoutPort = hostname.split(':')[0];
    let domainAllowed = false;

    if (hostname === platformDomain || hostname.startsWith(`${platformDomain}:`)) {
      // Main platform domain: ALWAYS allowed (admin access)
      domainAllowed = true;
    } else {
      // Custom domain: Verify ownership via database
      const { data: domainOwner, error: domainError } = await supabase.rpc(
        'get_business_by_custom_domain',
        { p_domain: hostname }
      );

      if (!domainError && domainOwner && domainOwner.length > 0) {
        // CRITICAL: Verify domain business matches email business
        if (domainOwner[0].id === userBusinessId) {
          domainAllowed = true;
        }
      }
      // Subdomain: Verify subdomain matches
      else if (hostnameWithoutPort.endsWith(`.${platformDomain}`)) {
        const subdomain = hostnameWithoutPort.split('.')[0];

        // CRITICAL: Verify subdomain matches email business
        if (subdomain === userSubdomain) {
          domainAllowed = true;
        }
      }
    }

    if (!domainAllowed) {
      return NextResponse.json(
        { error: 'This email is not associated with this business domain.' },
        { status: 403 }
      );
    }

    // STEP 3: Generate secure token
    const token = crypto.randomBytes(32).toString('hex'); // 64-char hex string
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // STEP 4: Store token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        business_account_id: userBusinessId,
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

    // STEP 5: Build reset link with domain context
    const protocol = hostname.includes('localhost') ? 'http' : 'https';
    const resetLink = `${protocol}://${hostname}/business/reset-password?token=${token}`;

    // STEP 6: Send password reset email
    console.log('[FORGOT-PW] Sending password reset email to:', email);

    const emailResult = await sendPasswordResetEmail({
      email,
      name: 'Business User', // Generic name since we don't have user name in this context
      resetUrl: resetLink,
    });

    if (!emailResult.success) {
      console.error('[FORGOT-PW] Failed to send email:', emailResult.error);
      // Still return success to user for security (don't reveal email sending status)
    } else {
      console.log('[FORGOT-PW] Email sent successfully, emailId:', emailResult.emailId);
    }

    return NextResponse.json(
      { message: 'If this email is registered, you will receive a password reset link.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password API error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
