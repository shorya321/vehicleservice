/**
 * Business team identity resolution.
 *
 * business_users.full_name / .email are nullable and were only ever backfilled
 * by 20260720_business_staff_users.sql, so rows created outside the signup
 * route can carry NULLs. Every other portal surface (the header in
 * app/business/(portal)/layout.tsx, the profile page, the email settings page)
 * already falls back through profiles and then business_accounts. This module
 * is that same chain, shared by the Team roster so it stops rendering "-" for a
 * member whose identity is sitting one table over.
 */

import { normalizeBusinessRole } from '@/lib/business/roles';
import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

export interface MemberIdentitySources {
  /** business_users.email */
  email: string | null;
  /** business_users.full_name */
  full_name: string | null;
  /** business_users.role, raw TEXT from the database */
  role: string;
  /** profiles.email for this member's auth user */
  profileEmail: string | null;
  /** profiles.full_name for this member's auth user */
  profileFullName: string | null;
  /** business_accounts.business_email - owner-only fallback */
  accountEmail: string | null;
  /** business_accounts.contact_person_name - owner-only fallback */
  accountContactName: string | null;
}

export interface ResolvedMemberIdentity {
  email: string | null;
  full_name: string | null;
}

/**
 * Resolve one member's display name and email.
 *
 * The tenant-level fallbacks (business_email / contact_person_name) are gated
 * on the owner role on purpose. They describe the business, not the person, so
 * applying them to staff would show every staff member the owner's identity as
 * their own - the exact bug layout.tsx documents at its own fallback chain.
 *
 * Uses `||` rather than `??` because these columns hold empty strings as well
 * as NULLs (profiles.full_name is '' on at least one live row), and an empty
 * string has to fall through to the next source.
 */
export function resolveMemberIdentity(
  sources: MemberIdentitySources
): ResolvedMemberIdentity {
  const isOwner = normalizeBusinessRole(sources.role) === 'owner';

  const email =
    sources.email || sources.profileEmail || (isOwner ? sources.accountEmail : null) || null;

  const full_name =
    sources.full_name ||
    sources.profileFullName ||
    (isOwner ? sources.accountContactName : null) ||
    email?.split('@')[0] ||
    null;

  return { email, full_name };
}

/** The business_users columns the roster selects. */
export interface TeamRosterRow {
  id: string;
  auth_user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

/** A roster row with its identity resolved, minus the internal auth_user_id. */
export type ResolvedTeamMember = Omit<TeamRosterRow, 'auth_user_id'>;

/**
 * Fill in every member's name and email from profiles, then from the business
 * account for the owner.
 *
 * Reads with the service-role client the caller already holds: RLS on profiles
 * exposes only the signed-in user's own row, so an anon-key read would resolve
 * nothing for anybody else on the roster.
 */
export async function resolveTeamRoster(
  adminClient: AdminClient,
  businessAccountId: string,
  rows: readonly TeamRosterRow[]
): Promise<ResolvedTeamMember[]> {
  if (rows.length === 0) return [];

  const authUserIds = rows.map((row) => row.auth_user_id).filter(Boolean);

  const [{ data: profiles }, { data: account }] = await Promise.all([
    adminClient.from('profiles').select('id, email, full_name').in('id', authUserIds),
    adminClient
      .from('business_accounts')
      .select('business_email, contact_person_name')
      .eq('id', businessAccountId)
      .maybeSingle(),
  ]);

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  return rows.map((row) => {
    const { auth_user_id, ...member } = row;
    const profile = profilesById.get(auth_user_id);

    return {
      ...member,
      ...resolveMemberIdentity({
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        profileEmail: profile?.email ?? null,
        profileFullName: profile?.full_name ?? null,
        accountEmail: account?.business_email ?? null,
        accountContactName: account?.contact_person_name ?? null,
      }),
    };
  });
}
