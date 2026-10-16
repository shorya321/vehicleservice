/**
 * Pure rules for the admin/vendor navigation loader. Kept free of the DOM so
 * they run under the node jest environment.
 *
 * 'page'  : a different pathname. Shows the top bar and the content overlay.
 * 'query' : same pathname, new search params (pagination, filters, tabs).
 *           Shows the top bar only, so typing in a filter never blanks the page.
 * null    : not a client navigation we can watch finish.
 */
export type NavigationKind = 'page' | 'query'

export interface ClickSnapshot {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export interface AnchorSnapshot {
  /** Resolved or raw href; resolved against the current URL. */
  href: string
  target: string | null
  download: boolean
  /** `data-no-progress` on the anchor or an ancestor. */
  optOut: boolean
  /** The click landed on a button/input nested inside the link, which may cancel it. */
  insideNestedControl: boolean
}

export interface AnchorLabelSource {
  dataLabel: string | null
  ariaLabel: string | null
  text: string | null
}

const MAX_LABEL_LENGTH = 60

export function classifyNavigation(href: string, currentHref: string): NavigationKind | null {
  let next: URL
  let current: URL
  try {
    current = new URL(currentHref)
    next = new URL(href, current)
  } catch {
    return null
  }

  if (next.protocol !== 'http:' && next.protocol !== 'https:') return null
  if (next.origin !== current.origin) return null
  if (next.pathname !== current.pathname) return 'page'
  if (next.search !== current.search) return 'query'
  return null
}

export function classifyLinkClick(
  click: ClickSnapshot,
  anchor: AnchorSnapshot,
  currentHref: string
): NavigationKind | null {
  if (click.button !== 0) return null
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null
  if (anchor.target && anchor.target !== '_self') return null
  if (anchor.download || anchor.optOut || anchor.insideNestedControl) return null
  return classifyNavigation(anchor.href, currentHref)
}

function clean(value: string | null): string | null {
  if (!value) return null
  const collapsed = value.replace(/\s+/g, ' ').trim()
  if (!collapsed || collapsed.length > MAX_LABEL_LENGTH) return null
  return collapsed
}

export function labelFromAnchor(source: AnchorLabelSource): string | null {
  return clean(source.dataLabel) ?? clean(source.ariaLabel) ?? clean(source.text)
}

export interface NavLabelEntry {
  href: string
  label: string
}

/** Structural match for the admin and vendor sidebar configs. */
interface NavConfigItem {
  name: string
  href: string
  submenu?: readonly { name: string; href: string }[]
}

export function flattenNavLabels(groups: readonly { items: readonly NavConfigItem[] }[]): NavLabelEntry[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => [
      { href: item.href, label: item.name },
      ...(item.submenu ?? []).map((sub) => ({ href: sub.href, label: sub.name })),
    ])
  )
}

/**
 * The sidebar section a path belongs to, by longest matching href, so
 * `/admin/bookings/123` reads "Bookings" rather than the "View" button text.
 */
export function labelForPath(href: string, entries: readonly NavLabelEntry[]): string | null {
  const pathname = href.split(/[?#]/)[0]
  let bestLength = -1
  let bestLabel: string | null = null
  for (const entry of entries) {
    const matches = pathname === entry.href || pathname.startsWith(`${entry.href}/`)
    if (matches && entry.href.length > bestLength) {
      bestLength = entry.href.length
      bestLabel = entry.label
    }
  }
  return bestLabel
}
