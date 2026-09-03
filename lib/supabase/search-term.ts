/**
 * Makes a user-supplied search term safe to interpolate into a PostgREST `or()` group.
 *
 * `or()` does not take a bound value, it takes a filter expression. A term carrying a comma or a
 * parenthesis therefore does not search for those characters, it closes the current condition and
 * opens another one, so `a,customer_id.neq.00000000-0000-0000-0000-000000000000` turns a search
 * box into a way to reshape the query it was supposed to feed.
 *
 * Backslash-escaping is not available inside an `or()` group, so the separators are stripped
 * rather than escaped. `%` and `_` go with them: they are `ilike` wildcards, and a term of `%`
 * matching every row is not what a search box promises. Nothing removed here is meaningful in an
 * address, a booking reference or an article title.
 *
 * NOTE: app/api/business/settings/email/logs/route.ts carries an equivalent private copy. That
 * duplication is DELIBERATE — the business module is kept independent of the customer flow, so do
 * not "de-duplicate" it into this module.
 */
export function sanitiseSearchTerm(term: string): string {
  return term.replace(/[,().*%_\\"']/g, ' ').replace(/\s+/g, ' ').trim()
}
