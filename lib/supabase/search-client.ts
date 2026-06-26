import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

let searchClient: ReturnType<typeof createClient<Database>> | null = null

export function createSearchClient() {
  if (searchClient) return searchClient

  searchClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: noopStorage,
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    }
  )

  return searchClient
}
