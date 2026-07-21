/**
 * Business member roles.
 *
 * Deliberately dependency-free: no next/headers, no Supabase, no next/server.
 * Client components (sidebar, header, command palette) import this to filter
 * their own UI, and api-utils.ts re-exports it for server code, so both sides
 * share one definition of what "owner" means.
 */

/**
 * owner - full access to the business account.
 * staff - create bookings, and see only the bookings they created.
 */
export type BusinessRole = 'owner' | 'staff';

/**
 * Coerce the raw role value from the database into a known role.
 * The column is plain TEXT, so anything unrecognised falls back to the
 * least-privileged role rather than being trusted.
 */
export function normalizeBusinessRole(role: unknown): BusinessRole {
  return role === 'owner' ? 'owner' : 'staff';
}

export function isOwnerRole(role: unknown): boolean {
  return normalizeBusinessRole(role) === 'owner';
}
