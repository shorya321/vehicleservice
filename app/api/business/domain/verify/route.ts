/**
 * Domain Verification API
 * Verify DNS records for custom domain
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dns from 'dns';
import { promisify } from 'util';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
} from '@/lib/business/api-utils';
import { getVercelCNAME } from '@/lib/business/domain-utils';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

/**
 * POST /api/business/domain/verify
 * Verify DNS configuration for custom domain
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
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
    // Get business account with domain info
    const { data: businessAccount, error: fetchError } = await supabaseAdmin
      .from('business_accounts')
      .select('custom_domain, domain_verification_token, custom_domain_verified')
      .eq('id', user.businessAccountId)
      .single();

    if (fetchError || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    if (!businessAccount.custom_domain) {
      return apiError('No custom domain configured', 400);
    }

    if (businessAccount.custom_domain_verified) {
      return apiSuccess({ verified: true, message: 'Domain already verified' });
    }

    const customDomain = businessAccount.custom_domain;
    const verificationToken = businessAccount.domain_verification_token;

    // Check CNAME record
    let cnameValid = false;
    try {
      const cnameRecords = await resolveCname(customDomain);
      const expectedCname = getVercelCNAME();
      cnameValid = cnameRecords.some((record) => record.includes('vercel-dns.com') || record === expectedCname);
    } catch (error) {
      console.log('CNAME lookup failed:', error);
    }

    // Check TXT record for verification
    let txtValid = false;
    if (verificationToken) {
      try {
        const txtRecordName = `_verify.${customDomain}`;
        const txtRecords = await resolveTxt(txtRecordName);
        txtValid = txtRecords.some((record) =>
          record.some((value) => value === verificationToken)
        );
      } catch (error) {
        console.log('TXT lookup failed:', error);
      }
    }

    // Both records must be valid
    if (cnameValid && txtValid) {
      // Mark domain as verified
      const { error: updateError } = await supabaseAdmin
        .from('business_accounts')
        .update({
          custom_domain_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.businessAccountId);

      if (updateError) {
        console.error('Failed to update verification status:', updateError);
        return apiError('Verification successful but failed to update status', 500);
      }

      // TODO: Add domain to Vercel via API (if using Vercel)
      // This would require VERCEL_TOKEN environment variable

      return apiSuccess({
        verified: true,
        message: 'Domain verified successfully!',
      });
    }

    // Return detailed status
    return apiSuccess({
      verified: false,
      cname_valid: cnameValid,
      txt_valid: txtValid,
      message: !cnameValid
        ? 'CNAME record not found or incorrect'
        : 'TXT verification record not found',
    });
  } catch (error) {
    console.error('Domain verification error:', error);
    return apiError('Failed to verify domain', 500);
  }
});
