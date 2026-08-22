import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Next signals control flow (dynamic bail-out, redirect, notFound) by throwing.
// Those throws are expected and must propagate untouched, not be logged as failures.
const NEXT_CONTROL_FLOW_DIGESTS = [
  'DYNAMIC_SERVER_USAGE',
  'BAILOUT_TO_CLIENT_SIDE_RENDERING',
  'NEXT_REDIRECT',
  'NEXT_NOT_FOUND',
  'NEXT_HTTP_ERROR_FALLBACK',
]

function isNextControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string'
    && NEXT_CONTROL_FLOW_DIGESTS.some((prefix) => digest.startsWith(prefix))
}

export const createClient = cache(async function createClient() {
  try {
    const cookieStore = await cookies()

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    return supabase
  } catch (error) {
    if (!isNextControlFlow(error)) {
      console.error('Failed to create Supabase client:', error)
    }
    throw error
  }
})
