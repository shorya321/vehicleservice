import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Full names for the given reviewer profiles, keyed by profile id.
 *
 * Read with the service role on purpose: anonymous visitors cannot read
 * `profiles`, so a session read would show names to signed-in visitors only.
 * Only `full_name` is selected; callers shorten it to "First L." before it
 * reaches the page. Never throws: a failure returns no names and the cards
 * fall back to a neutral label.
 */
export async function loadReviewerNames(customerIds: readonly string[]): Promise<Map<string, string>> {
  const ids = [...new Set(customerIds.filter(Boolean))]
  if (ids.length === 0) return new Map()

  try {
    const { data, error } = await createAdminClient()
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)

    if (error) {
      console.error('[Reviews] Reviewer names unavailable:', error)
      return new Map()
    }

    return new Map(
      (data ?? [])
        .filter((row): row is { id: string; full_name: string } => typeof row.full_name === 'string')
        .map((row) => [row.id, row.full_name])
    )
  } catch (error) {
    console.error('[Reviews] Reviewer names unavailable:', error)
    return new Map()
  }
}
