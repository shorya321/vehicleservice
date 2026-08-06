/**
 * Shapes for the business activity log.
 *
 * Dependency-free so both client components and server code can import them.
 * Kept out of any 'use server' module: a type exported from one of those breaks
 * at runtime while tsc stays silent (see lib/business/quotations/persist.ts and
 * app/business/(portal)/quotations/actions.ts for the same note).
 */

import type {
  ActivityActorType,
  ActivityCategory,
  ActivityEntityType,
  ActivitySeverity,
  BusinessActivityAction,
} from './catalog';

export type {
  ActivityActorType,
  ActivityCategory,
  ActivityEntityType,
  ActivitySeverity,
  BusinessActivityAction,
};

/**
 * A single field change. Values are snapshots taken at write time, never
 * resolved from live tables at read time, so the row still reads correctly
 * after the entity is renamed or deleted.
 */
export interface ActivityFieldChange {
  from: unknown;
  to: unknown;
}

export type ActivityChanges = Record<string, ActivityFieldChange>;

/** One row of business_activity_logs as returned to the UI. */
export interface ActivityEvent {
  id: string;
  businessAccountId: string;

  actorType: ActivityActorType;
  actorAuthUserId: string | null;
  actorBusinessUserId: string | null;
  actorRole: string | null;
  /** Snapshot of the display name at write time. May be 'Platform admin'. */
  actorName: string;
  actorEmail: string | null;

  action: string;
  category: ActivityCategory;
  severity: ActivitySeverity;

  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;

  changes: ActivityChanges | null;
  metadata: Record<string, unknown>;

  amount: number | null;
  currency: string | null;

  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;

  createdAt: string;
}

/**
 * Actor filter. 'me' resolves server side against the caller, so the client
 * never has to know its own business_users.id.
 */
export type ActivityActorFilter =
  | { kind: 'any' }
  | { kind: 'me' }
  | { kind: 'member'; businessUserId: string }
  | { kind: 'actorType'; actorType: ActivityActorType };

export interface ActivityFilters {
  categories?: ActivityCategory[];
  severities?: ActivitySeverity[];
  actor?: ActivityActorFilter;
  search?: string;
  /** ISO timestamps. */
  from?: string;
  to?: string;
}

/**
 * Keyset cursor. The feed is append-only and unbounded, so offset paging would
 * both walk-and-discard at depth and duplicate or skip rows as new events
 * arrive at the head while the owner reads. Ordered by (created_at, id) DESC.
 */
export interface ActivityCursor {
  createdAt: string;
  id: string;
}

export interface ActivityPage {
  events: ActivityEvent[];
  nextCursor: ActivityCursor | null;
  hasMore: boolean;
}

export interface ActivityStats {
  totalEvents: number;
  criticalEvents: number;
  moneyIn: number;
  moneyOut: number;
  currency: string;
  topActor: { name: string; businessUserId: string | null; count: number } | null;
  countsByCategory: Record<string, number>;
}

/**
 * One piece of a rendered activity sentence.
 *
 * The row component maps these to elements (bold actor, inline Link for the
 * entity, coloured amount) while the CSV exporter flattens the same segments to
 * plain text. One source of truth for the sentence, two consumers.
 */
export interface MessageSegment {
  kind: 'text' | 'actor' | 'entity' | 'amount';
  value: string;
  href?: string;
  /** Entity no longer exists: render as struck-through text, not a dead link. */
  deleted?: boolean;
}
