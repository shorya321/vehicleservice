import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

let publicClient: ReturnType<typeof createClient<Database>> | null = null

export function createPublicClient() {
  if (publicClient) return publicClient

  publicClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  return publicClient
}
