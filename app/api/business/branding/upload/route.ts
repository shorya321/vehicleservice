/**
 * Logo Upload API
 * Handles business logo uploads to Supabase Storage
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createClient } from '@supabase/supabase-js';

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const STORAGE_BUCKET = 'business-logos';

/**
 * POST /api/business/branding/upload
 * Upload business logo to Supabase Storage
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError('No file provided', 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError('File size must not exceed 2MB', 400);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError('Only JPEG, PNG, WebP, and SVG images are allowed', 400);
    }

    // Create Supabase admin client for storage operations
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

    // Generate unique file name to prevent collisions
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${user.businessAccountId}/logo_${timestamp}.${fileExtension}`;

    // Delete old logo if exists (cleanup)
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('logo_url')
      .eq('id', user.businessAccountId)
      .single();

    if (businessAccount?.logo_url) {
      // Extract file path from URL
      const oldPath = businessAccount.logo_url.split(`${STORAGE_BUCKET}/`).pop();
      if (oldPath) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([oldPath]);
      }
    }

    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return apiError('Failed to upload logo', 500);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update business_accounts with new logo URL
    const { error: updateError } = await supabaseAdmin
      .from('business_accounts')
      .update({ logo_url: logoUrl })
      .eq('id', user.businessAccountId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Cleanup uploaded file on database error
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([fileName]);
      return apiError('Failed to update logo URL', 500);
    }

    return apiSuccess({
      message: 'Logo uploaded successfully',
      logo_url: logoUrl,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return apiError('Failed to upload logo', 500);
  }
});

/**
 * DELETE /api/business/branding/upload
 * Delete business logo
 */
export const DELETE = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    // Create Supabase admin client
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

    // Get current logo URL
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('logo_url')
      .eq('id', user.businessAccountId)
      .single();

    if (!businessAccount?.logo_url) {
      return apiError('No logo to delete', 404);
    }

    // Extract file path from URL
    const filePath = businessAccount.logo_url.split(`${STORAGE_BUCKET}/`).pop();

    if (!filePath) {
      return apiError('Invalid logo URL', 400);
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      return apiError('Failed to delete logo from storage', 500);
    }

    // Update database to remove logo URL
    const { error: updateError } = await supabaseAdmin
      .from('business_accounts')
      .update({ logo_url: null })
      .eq('id', user.businessAccountId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return apiError('Failed to update database', 500);
    }

    return apiSuccess({
      message: 'Logo deleted successfully',
    });
  } catch (error) {
    console.error('Logo deletion error:', error);
    return apiError('Failed to delete logo', 500);
  }
});
