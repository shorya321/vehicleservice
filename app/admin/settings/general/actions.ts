'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import type { Json } from '@/lib/supabase/types'
import { siteSettingsSchema } from '@/lib/site-settings/schema'

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  return { userId: user.id }
}

export async function updateSiteSettings(
  config: SiteSettingsConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = siteSettingsSchema.safeParse(config)
    if (!parsed.success) {
      return { success: false, error: 'Invalid settings data' }
    }

    const auth = await requireAdmin()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const validatedConfig = parsed.data
    const adminClient = createAdminClient()

    // Get existing row ID
    const { data: existing } = await adminClient
      .from('site_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      const { error } = await adminClient
        .from('site_settings')
        .update({
          config: validatedConfig as unknown as Json,
          updated_at: new Date().toISOString(),
          updated_by: auth.userId,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('[SiteSettings] Error updating:', error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await adminClient
        .from('site_settings')
        .insert({
          config: validatedConfig as unknown as Json,
          updated_by: auth.userId,
        })

      if (error) {
        console.error('[SiteSettings] Error inserting:', error)
        return { success: false, error: error.message }
      }
    }

    revalidateTag('site-settings')
    revalidatePath('/admin/settings/general')

    return { success: true }
  } catch (error) {
    console.error('[SiteSettings] Error in updateSiteSettings:', error)
    return { success: false, error: 'Failed to update site settings' }
  }
}

export async function uploadSiteLogo(
  formData: FormData
): Promise<{ url: string | null; error?: string }> {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return { url: null, error: auth.error }
    }

    const file = formData.get('file') as File | null
    const logoType = formData.get('type') as string | null

    if (!file) {
      return { url: null, error: 'No file provided' }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG' }
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return { url: null, error: 'File too large. Maximum size: 2MB' }
    }

    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    }
    const ext = MIME_TO_EXT[file.type] ?? 'png'
    const prefix = logoType === 'footer' ? 'footer_logo' : 'header_logo'
    const fileName = `site-logos/${prefix}_${Date.now()}.${ext}`

    const adminClient = createAdminClient()

    const { error: uploadError } = await adminClient.storage
      .from('user-uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[SiteSettings] Upload error:', uploadError)
      return { url: null, error: uploadError.message }
    }

    const { data: urlData } = adminClient.storage
      .from('user-uploads')
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl }
  } catch (error) {
    console.error('[SiteSettings] Error in uploadSiteLogo:', error)
    return { url: null, error: 'Failed to upload logo' }
  }
}

export async function removeSiteLogo(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const pathMatch = url.match(/user-uploads\/(.+)$/)
    if (!pathMatch) {
      return { success: false, error: 'Invalid logo URL' }
    }

    const filePath = pathMatch[1]
    if (!filePath.startsWith('site-logos/')) {
      return { success: false, error: 'Invalid logo path' }
    }
    const adminClient = createAdminClient()

    const { error } = await adminClient.storage
      .from('user-uploads')
      .remove([filePath])

    if (error) {
      console.error('[SiteSettings] Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[SiteSettings] Error in removeSiteLogo:', error)
    return { success: false, error: 'Failed to remove logo' }
  }
}
