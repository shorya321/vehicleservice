import { createClient } from '@/lib/supabase/server'

export type AdminActionAuth = { userId: string } | { error: string }

/**
 * Admin check for Server Actions. Returns an error instead of redirecting:
 * a redirect answered to an action POST leaves the client promise pending
 * forever, so the form would spin instead of showing the message.
 */
export async function requireAdminAction(): Promise<AdminActionAuth> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Your session has expired. Sign in again to continue.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can do that.' }
  }

  return { userId: user.id }
}
