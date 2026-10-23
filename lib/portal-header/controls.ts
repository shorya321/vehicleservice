/**
 * Pure helpers for the admin and vendor header controls (status chip and
 * profile menu). Kept free of React so they can be unit tested in node.
 */

export type PortalStatusTone = 'ok' | 'warn' | 'danger'

export interface PortalStatus {
  label: string
  tone: PortalStatusTone
  href: string
}

/** Admin chip: reflects the site-wide maintenance switch in Settings. */
export function adminSiteStatus(maintenanceMode: boolean): PortalStatus {
  return maintenanceMode
    ? { label: 'Maintenance on', tone: 'warn', href: '/admin/settings' }
    : { label: 'Site live', tone: 'ok', href: '/admin/settings' }
}

/**
 * Vendor chip: reflects the vendor application status. Returns null for an
 * unknown or missing status so the header never shows a made-up state.
 */
export function vendorProfileStatus(status: string | null | undefined): PortalStatus | null {
  switch (status) {
    case 'approved':
      return { label: 'Profile active', tone: 'ok', href: '/vendor/profile' }
    case 'pending':
      return { label: 'Profile pending', tone: 'warn', href: '/vendor/profile' }
    case 'rejected':
      return { label: 'Profile rejected', tone: 'danger', href: '/vendor/profile' }
    default:
      return null
  }
}

/** Two-letter initials from a name, falling back to the email, then "U". */
export function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  const trimmed = name?.trim()
  if (trimmed) {
    return trimmed
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return 'U'
}
