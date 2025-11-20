/**
 * Custom Domain Configuration API
 * Set or update custom domain for business account
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { customDomainSchema } from '@/lib/business/validators';
import {
  isValidDomain,
  generateVerificationToken,
} from '@/lib/business/domain-utils';

/**
 * POST /api/business/domain
 * Configure custom domain for business account
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, customDomainSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  const { custom_domain } = body;

  // Additional domain validation
  if (!isValidDomain(custom_domain)) {
    return apiError('Invalid domain format', 400);
  }

  // Use admin client to update business account
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

  try {
    // Check if domain is already in use by another business
    const { data: existingDomain } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .eq('custom_domain', custom_domain)
      .neq('id', user.businessAccountId)
      .single();

    if (existingDomain) {
      return apiError('This domain is already in use by another business', 409);
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Update business account with custom domain
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        custom_domain,
        custom_domain_verified: false,
        domain_verification_token: verificationToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.businessAccountId);

    if (error) {
      console.error('Domain configuration error:', error);
      return apiError('Failed to configure domain', 500);
    }

    return apiSuccess({
      custom_domain,
      verification_token: verificationToken,
      message: 'Domain configured. Please add DNS records and verify.',
    });
  } catch (error) {
    console.error('Domain API error:', error);
    return apiError('Failed to configure domain', 500);
  }
});

/**
 * DELETE /api/business/domain
 * Remove custom domain configuration
 */
export const DELETE = requireBusinessAuth(async (request: NextRequest, user) => {
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

  try {
    // First, get the current domain to remove from Vercel
    const { data: businessAccount, error: fetchError } = await supabaseAdmin
      .from('business_accounts')
      .select('custom_domain')
      .eq('id', user.businessAccountId)
      .single();

    if (fetchError || !businessAccount) {
      console.error('Failed to fetch business account:', fetchError);
      return apiError('Business account not found', 404);
    }

    const domainToRemove = businessAccount.custom_domain;

    // Remove from Vercel before database cleanup
    if (domainToRemove) {
      const { removeDomainFromVercel, isVercelConfigured } = await import('@/lib/vercel/api');

      if (isVercelConfigured()) {
        console.log(`Removing domain ${domainToRemove} from Vercel...`);
        const vercelResult = await removeDomainFromVercel(domainToRemove);

        if (!vercelResult.success) {
          console.error('Failed to remove domain from Vercel:', vercelResult.error);
          // Continue with database cleanup even if Vercel removal fails
          // Admin can manually remove from Vercel if needed
        } else {
          console.log(`Domain ${domainToRemove} successfully removed from Vercel`);
        }
      }
    }

    // Now remove from database
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({
        custom_domain: null,
        custom_domain_verified: false,
        domain_verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.businessAccountId);

    if (error) {
      console.error('Domain removal error:', error);
      return apiError('Failed to remove domain', 500);
    }

    return apiSuccess({ message: 'Custom domain removed' });
  } catch (error) {
    console.error('Domain API error:', error);
    return apiError('Failed to remove domain', 500);
  }
});
