import type { LucideIcon } from 'lucide-react'

/**
 * Navigation model and pure rules for the admin and vendor sidebars. Kept
 * free of React so the active, expanded and count rules run under node jest.
 * The `name`/`href` shape is also what `flattenNavLabels` reads for the
 * navigation loader, so keep those field names.
 */

export interface PortalNavSubItem {
  name: string
  href: string
}

export interface PortalNavItem {
  name: string
  href: string
  icon: LucideIcon
  submenu?: PortalNavSubItem[]
}

export interface PortalNavGroup {
  label: string
  items: PortalNavItem[]
}

/** Unread or pending counts keyed by nav href. */
export type PortalNavCounts = Readonly<Record<string, number>>

/** Segment-aware match: `/admin/vehicles` matches `/admin/vehicles/12`, never `/admin/vehicles-x`. */
export function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isItemActive(pathname: string, item: PortalNavItem): boolean {
  if (item.submenu?.length) {
    return item.submenu.some((sub) => matchesPath(pathname, sub.href))
  }
  return matchesPath(pathname, item.href)
}

/** Names of the submenu parents that hold the current page, so they start open. */
export function activeParentNames(groups: readonly PortalNavGroup[], pathname: string): string[] {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => item.submenu?.some((sub) => matchesPath(pathname, sub.href)))
    .map((item) => item.name)
}

/** Pill text for a count: nothing at zero, `9+` above nine. */
export function countLabel(count: number | undefined): string | null {
  if (!count || count <= 0) return null
  return count > 9 ? '9+' : String(count)
}

/** Whether any child of a submenu parent carries a count, for the parent's dot. */
export function submenuHasCount(item: PortalNavItem, counts: PortalNavCounts): boolean {
  return (item.submenu ?? []).some((sub) => countLabel(counts[sub.href]) !== null)
}
