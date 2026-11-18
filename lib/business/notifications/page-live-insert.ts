/**
 * List helpers for a notifications page that receives realtime INSERTs.
 *
 * The pages page by offset (20 at a time). A live row added at the top shifts
 * every later offset by one, so the next "Load more" returns the last row already
 * shown. appendUniqueBusinessNotifications drops it; without that the row appears twice
 * and React warns about a duplicate key.
 *
 * Business module copy on purpose; admin and vendor use
 * lib/notifications/page-live-insert.ts.
 */

interface ListRow {
  id: string;
  category: string;
}

/**
 * Adds an incoming row at the top when it belongs on the active tab and is not
 * listed yet. Returns the same array otherwise, so React skips the update.
 */
export function mergeIncomingBusinessNotification<T extends ListRow>(
  list: T[],
  row: T,
  activeCategory: string
): T[] {
  if (activeCategory !== 'all' && row.category !== activeCategory) return list;
  if (list.some((n) => n.id === row.id)) return list;
  return [row, ...list];
}

/** Appends a fetched page, skipping rows already shown (and repeats within it). */
export function appendUniqueBusinessNotifications<T extends { id: string }>(list: T[], next: T[]): T[] {
  const seen = new Set(list.map((n) => n.id));
  const fresh: T[] = [];
  for (const n of next) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    fresh.push(n);
  }
  return fresh.length === 0 ? list : [...list, ...fresh];
}
