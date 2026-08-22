import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * A Supabase client that can do exactly one thing: run one storage request.
 *
 * Two deliberate differences from `lib/supabase/client.ts`.
 *
 * 1. The top-level `accessToken` option. supabase-js resolves the bearer token
 *    by calling this function instead of `auth.getSession()`, and setting it
 *    also skips building the auth client at all. That matters because
 *    `getSession()` runs inside the GoTrue Web Lock, which auth-js acquires
 *    with a timeout of -1, meaning it waits for whoever holds it without any
 *    limit. The whole app shares one lock, and it is held during every token
 *    refresh and its backoff, every client-side `getUser()`, and for the full
 *    duration of any `onAuthStateChange` callback. A held lock is why an
 *    upload could time out after 60 seconds with no HTTP request ever leaving
 *    the browser. This client never touches it.
 *
 *    The anon key here is not what authorizes the write. These uploads go to a
 *    signed URL, so the `?token=` query parameter carries the permission and
 *    the header is only there to satisfy the API gateway.
 *
 * 2. A `global.fetch` that attaches `signal`. storage-js declares `signal` on
 *    `FileOptions` and never reads it, so an injected fetch is the only way to
 *    cancel an upload that has overrun its budget.
 *
 * The return type is narrowed to `storage` on purpose: with `accessToken` set,
 * `client.auth` is a Proxy that throws on any property access, so hiding it
 * turns a runtime explosion into a compile error.
 *
 * Build one per upload. Construction is synchronous wiring with no I/O, no
 * socket and no scheduled timer, and a per-upload instance keeps one request's
 * abort signal from reaching another's.
 */
export function createUploadClient(
  signal: AbortSignal
): Pick<SupabaseClient<Database>, 'storage'> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, anonKey, {
    accessToken: async () => anonKey,
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal }),
    },
  })
}
