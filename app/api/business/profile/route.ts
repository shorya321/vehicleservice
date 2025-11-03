/**
 * Business Profile API
 * Update business account profile information
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { businessProfileUpdateSchema } from '@/lib/business/validators';

/**
 * PUT /api/business/profile
 * Update business account profile
 */
export const PUT = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, businessProfileUpdateSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
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
    // Build update object (only include fields that are provided)
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.business_name !== undefined) updateData.business_name = body.business_name;
    if (body.business_phone !== undefined) updateData.business_phone = body.business_phone;
    if (body.contact_person_name !== undefined)
      updateData.contact_person_name = body.contact_person_name;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.city !== undefined) updateData.city = body.city || null;
    if (body.country_code !== undefined) updateData.country_code = body.country_code || null;

    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update(updateData)
      .eq('id', user.businessAccountId);

    if (error) {
      console.error('Profile update error:', error);
      return apiError('Failed to update profile', 500);
    }

    return apiSuccess({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile API error:', error);
    return apiError('Failed to update profile', 500);
  }
});
