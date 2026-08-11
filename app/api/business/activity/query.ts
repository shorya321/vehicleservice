/**
 * Shared query helpers for the activity endpoints.
 *
 * Not a route: Next only treats route.ts as an endpoint, so a sibling module is
 * the normal place for logic the feed, stats and export routes all need.
 */

import type { BusinessUserContext } from '@/lib/business/api-utils';
import type { ActivityEvent } from '@/lib/business/activity/types';

export interface ParsedActivityFilters {
  categories: string[];
  severities: string[];
  actorBusinessUserId: string | null;
  actorType: string | null;
  search: string | null;
  from: string | null;
  to: string | null;
}

/** Row shape as it comes back from Supabase, before camel-casing. */
interface ActivityRow {
  id: string;
  business_account_id: string;
  actor_type: string;
  actor_auth_user_id: string | null;
  actor_business_user_id: string | null;
  actor_role: string | null;
  actor_name: string;
  actor_email: string | null;
  action: string;
  category: string;
  severity: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  changes: unknown;
  metadata: unknown;
  amount: string | number | null;
  currency: string | null;
  /** inet, which the generated types surface as unknown. */
  ip_address: unknown;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

export function mapActivityRow(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    businessAccountId: row.business_account_id,
    actorType: row.actor_type as ActivityEvent['actorType'],
    actorAuthUserId: row.actor_auth_user_id,
    actorBusinessUserId: row.actor_business_user_id,
    actorRole: row.actor_role,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    category: row.category as ActivityEvent['category'],
    severity: row.severity as ActivityEvent['severity'],
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    changes: (row.changes as ActivityEvent['changes']) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    // numeric(12,2) arrives as a string over the wire.
    amount: row.amount === null ? null : Number(row.amount),
    currency: row.currency,
    ipAddress: typeof row.ip_address === 'string' ? row.ip_address : null,
    userAgent: row.user_agent,
    requestId: row.request_id,
    createdAt: row.created_at,
  };
}

function csv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseActivityFilters(
  searchParams: URLSearchParams,
  user: BusinessUserContext
): ParsedActivityFilters {
  const actor = searchParams.get('actor');

  // 'me' is resolved server side so the client never needs to know its own
  // business_users.id.
  let actorBusinessUserId: string | null = null;
  let actorType: string | null = null;

  if (actor === 'me') {
    actorBusinessUserId = user.businessId;
  } else if (actor?.startsWith('type:')) {
    actorType = actor.slice('type:'.length);
  } else if (actor && actor !== 'any') {
    actorBusinessUserId = actor;
  }

  return {
    categories: csv(searchParams.get('categories')),
    severities: csv(searchParams.get('severities')),
    actorBusinessUserId,
    actorType,
    search: searchParams.get('search')?.trim() || null,
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  };
}

/**
 * The Supabase query builder is generic in ways that fight a shared helper, and
 * these endpoints only ever chain filters onto it.
 */
type FilterableQuery = {
  in: (column: string, values: string[]) => FilterableQuery;
  eq: (column: string, value: string) => FilterableQuery;
  gte: (column: string, value: string) => FilterableQuery;
  lte: (column: string, value: string) => FilterableQuery;
  or: (filter: string) => FilterableQuery;
};

export function applyActivityFilters<T extends FilterableQuery>(
  query: T,
  filters: ParsedActivityFilters
): T {
  let next = query;

  if (filters.categories.length) next = next.in('category', filters.categories) as T;
  if (filters.severities.length) next = next.in('severity', filters.severities) as T;
  if (filters.actorBusinessUserId) {
    next = next.eq('actor_business_user_id', filters.actorBusinessUserId) as T;
  }
  if (filters.actorType) next = next.eq('actor_type', filters.actorType) as T;
  if (filters.from) next = next.gte('created_at', filters.from) as T;
  if (filters.to) next = next.lte('created_at', filters.to) as T;

  if (filters.search) {
    // Commas, parentheses and quotes are PostgREST filter syntax and would let
    // a search term escape into the query grammar.
    const safe = filters.search.replace(/[,()"\\]/g, ' ').trim();
    if (safe) {
      // metadata->>booking_number keeps booking numbers findable now that
      // entity_label carries the trip number instead. Rows written before
      // 20260811120100 simply have no such key and fall through to the other
      // three columns.
      next = next.or(
        `actor_name.ilike.%${safe}%,entity_label.ilike.%${safe}%,action.ilike.%${safe}%,metadata->>booking_number.ilike.%${safe}%`
      ) as T;
    }
  }

  return next;
}
