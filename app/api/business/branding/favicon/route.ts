/**
 * Favicon Upload API
 * Handles the business portal's browser-tab icon in Supabase Storage.
 * Mirrors ../upload/route.ts (the logo), kept separate so the logo flow is untouched.
 */

import { NextRequest } from 'next/server';
import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { activityLogger } from '@/lib/business/activity/log';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const STORAGE_BUCKET = 'business-logos';

// Extension from the validated MIME type, never from the client's file name.
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

function storageAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function storagePath(publicUrl: string): string | undefined {
  return publicUrl.split(`${STORAGE_BUCKET}/`).pop();
}

/**
 * POST /api/business/branding/favicon
 * Upload the business favicon, replacing any previous one.
 */
export const POST = requireBusinessOwner(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('No file provided', 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return apiError('File size must not exceed 2MB', 400);
    }
    const extension = EXTENSION_BY_MIME[file.type];
    if (!extension) {
      return apiError('Only PNG, SVG and ICO images are allowed', 400);
    }

    const supabaseAdmin = storageAdmin();
    const fileName = `${user.businessAccountId}/favicon_${Date.now()}.${extension}`;

    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('favicon_url')
      .eq('id', user.businessAccountId)
      .single();

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Favicon storage upload error:', uploadError);
      return apiError('Failed to upload favicon', 500);
    }

    const faviconUrl = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName).data.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from('business_accounts')
      .update({ favicon_url: faviconUrl })
      .eq('id', user.businessAccountId);

    if (updateError) {
      console.error('Favicon database update error:', updateError);
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([fileName]);
      return apiError('Failed to save favicon', 500);
    }

    // Old file removed only once the new one is saved, so a failed upload
    // never leaves the portal pointing at a deleted icon.
    const oldPath = businessAccount?.favicon_url ? storagePath(businessAccount.favicon_url) : undefined;
    if (oldPath) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([oldPath]);
    }

    await activityLogger(user, request)('settings.favicon_uploaded', {
      entity: { id: user.businessAccountId, label: user.businessName },
      metadata: { file_name: fileName, file_size_bytes: file.size },
    });

    return apiSuccess({ message: 'Favicon uploaded successfully', favicon_url: faviconUrl });
  } catch (error) {
    console.error('Favicon upload error:', error);
    return apiError('Failed to upload favicon', 500);
  }
});

/**
 * DELETE /api/business/branding/favicon
 * Remove the business favicon. The portal falls back to the initials icon.
 */
export const DELETE = requireBusinessOwner(async (request: NextRequest, user) => {
  try {
    const supabaseAdmin = storageAdmin();

    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('favicon_url')
      .eq('id', user.businessAccountId)
      .single();

    if (!businessAccount?.favicon_url) {
      return apiError('No favicon to delete', 404);
    }

    const filePath = storagePath(businessAccount.favicon_url);
    if (!filePath) {
      return apiError('Invalid favicon URL', 400);
    }

    const { error: updateError } = await supabaseAdmin
      .from('business_accounts')
      .update({ favicon_url: null })
      .eq('id', user.businessAccountId);

    if (updateError) {
      console.error('Favicon database update error:', updateError);
      return apiError('Failed to update database', 500);
    }

    const { error: storageError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
    if (storageError) {
      // The column is already cleared, so the portal is correct; only the file lingers.
      console.error('Favicon storage deletion error:', storageError);
    }

    await activityLogger(user, request)('settings.favicon_removed', {
      entity: { id: user.businessAccountId, label: user.businessName },
      metadata: { previous_file_name: filePath },
    });

    return apiSuccess({ message: 'Favicon deleted successfully' });
  } catch (error) {
    console.error('Favicon deletion error:', error);
    return apiError('Failed to delete favicon', 500);
  }
});
