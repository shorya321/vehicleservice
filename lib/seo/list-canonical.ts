/**
 * Canonical path for a paginated list. Page 2 onward keeps its own URL so its
 * posts can still be found; search, sort and filter variants all point back at
 * the plain list, so they never compete with it in search results.
 */
export function listCanonical(path: string, page: string | undefined): string {
  const n = Number.parseInt(page ?? '', 10)
  return Number.isFinite(n) && n > 1 ? `${path}?page=${n}` : path
}
