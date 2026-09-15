import type { Database } from '@/lib/supabase/types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

/**
 * The only profile columns the public header and mobile menu read. The header
 * is a client component, so whatever row it receives is serialised into the
 * page payload; selecting `*` shipped every profile column to the browser.
 */
export const HEADER_PROFILE_COLUMNS =
  'id, full_name, avatar_url, role' as const

export type HeaderProfile = Pick<
  ProfileRow,
  'id' | 'full_name' | 'avatar_url' | 'role'
>
