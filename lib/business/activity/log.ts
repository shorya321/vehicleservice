/**
 * The business activity writer.
 *
 * Server only. Everything here talks to the service-role client, so importing
 * it from a client component would be a real leak. `server-only` is not a
 * dependency of this project, so the guard below is the equivalent: it turns a
 * mistaken client import into an immediate, obvious runtime error rather than a
 * silent undefined key.
 *
 * This module lives in lib/, not app/, and is deliberately NOT a 'use server'
 * module. A type exported from one of those breaks at runtime while tsc stays
 * silent (see app/business/(portal)/quotations/actions.ts). Route handlers are
 * not server actions either, so 'use server' would be wrong regardless.
 *
 * Contract: logBusinessActivity never throws and never returns a result. A
 * caller who could meaningfully handle a logging failure would write a catch
 * that swallows it; a caller who could not would crash a booking over an audit
 * row. Removing the option removes the mistake.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'lib/business/activity/log.ts is server only and must not be imported from a client component'
  );
}

import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import { getActivityDefinition, type BusinessActivityAction } from './catalog';
import type { ActivityActorType, ActivityChanges, ActivitySeverity } from './types';

const MAX_METADATA_BYTES = 4096;
const MAX_USER_AGENT_LENGTH = 512;

/**
 * Keys whose values must never be written, in any casing. Field names are kept
 * so the owner can still see that something changed; only the value is
 * withheld. Same principle as 20260728_audit_vendor_application_edits.sql.
 */
const SECRET_KEY_PATTERN = /(secret|password|token|api[_-]?key|client[_-]?secret|signature|cvv|card[_-]?number)/i;

export interface BusinessActivityActor {
  type: ActivityActorType;
  /**
   * Snapshot taken at write time. Survives the underlying user being deleted.
   *
   * Leave it undefined rather than passing a generic placeholder: the RPC then
   * resolves the real name from business_users and falls back to profiles.
   * business_users.full_name and .email are null on accounts created before
   * 20260720_business_staff_users.sql, so a placeholder here would permanently
   * bury a name the database could have supplied.
   */
  name?: string | null;
  authUserId?: string | null;
  businessUserId?: string | null;
  role?: string | null;
  email?: string | null;
}

export interface BusinessActivityInput {
  businessAccountId: string;
  action: BusinessActivityAction;
  actor: BusinessActivityActor;
  /** Overrides the catalog default. Rarely needed. */
  severity?: ActivitySeverity;
  entity?: { type?: string; id?: string | null; label?: string | null };
  changes?: ActivityChanges | null;
  metadata?: Record<string, unknown>;
  amount?: number | null;
  currency?: string | null;
  /** Preferred source of ip and user agent. Synchronous, always in scope in a route handler. */
  request?: Request;
  /** Webhooks and background jobs that have no request scope. */
  skipRequestContext?: boolean;
}

/** Drop secret-shaped entries and anything that would bloat the row. */
function redact(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      out[key] = '[redacted]';
      continue;
    }
    out[key] = value;
  }
  return out;
}

function redactChanges(changes: ActivityChanges): ActivityChanges {
  const out: ActivityChanges = {};
  for (const [field, change] of Object.entries(changes)) {
    out[field] = SECRET_KEY_PATTERN.test(field)
      ? { from: '[redacted]', to: '[redacted]' }
      : change;
  }
  return out;
}

/**
 * Remove fields whose value did not actually change.
 * This is the single highest-value noise filter in the design and it belongs
 * here rather than at 40 call sites: opening a settings form and pressing Save
 * without touching anything must not write a row.
 */
function pruneUnchanged(changes: ActivityChanges): ActivityChanges {
  const out: ActivityChanges = {};
  for (const [field, change] of Object.entries(changes)) {
    if (!change) continue;
    const from = change.from ?? null;
    const to = change.to ?? null;
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    out[field] = { from, to };
  }
  return out;
}

function capMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const serialized = JSON.stringify(metadata);
  if (!serialized || serialized.length <= MAX_METADATA_BYTES) return metadata;

  const scalarsOnly: Record<string, unknown> = { truncated: true };
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      scalarsOnly[key] = typeof value === 'string' ? value.slice(0, 200) : value;
    }
  }
  return scalarsOnly;
}

async function readRequestContext(
  input: BusinessActivityInput
): Promise<{ ip: string | null; userAgent: string | null }> {
  if (input.skipRequestContext) return { ip: null, userAgent: null };

  try {
    // Prefer the Request: synchronous, cannot throw, and available in every
    // business API route (requireBusinessAuth hands the handler one). Fall back
    // to headers() only for server actions, which have no Request.
    let headers: Headers;
    if (input.request) {
      headers = input.request.headers;
    } else {
      // headers() is async in Next 15+/16, same as params and searchParams.
      // Dynamic import keeps this module usable from Jest and plain scripts.
      const { headers: nextHeaders } = await import('next/headers');
      headers = await nextHeaders();
    }

    // x-forwarded-for is a comma separated chain; the client is the first hop.
    const forwarded = headers.get('x-forwarded-for');
    const ip =
      forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;

    return {
      ip,
      userAgent: headers.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
    };
  } catch (error) {
    // headers() throws outside a request scope. A missing IP must never cost
    // us the row.
    console.error('[activity-log] request context unavailable', error);
    return { ip: null, userAgent: null };
  }
}

/**
 * Write one activity row. Never throws.
 *
 * category and severity come from the catalog, not from the caller, so a call
 * site cannot mis-file an action.
 */
export async function logBusinessActivity(input: BusinessActivityInput): Promise<void> {
  try {
    if (!input?.businessAccountId || !input?.action) return;

    // createAdminClient() uses process.env.X!, which is a compile-time
    // assertion only. Without the key, createClient(undefined, undefined)
    // throws and would otherwise take down every instrumented route in a
    // preview deploy that lacks the service role key.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[activity-log] service role key not configured, skipping', input.action);
      return;
    }

    const definition = getActivityDefinition(input.action);

    let changes: ActivityChanges | null = null;
    if (input.changes) {
      // Prune BEFORE redacting. Redacting first would rewrite both sides of a
      // changed secret to the same placeholder, prune would then see no change,
      // and a rotated credential would vanish from the log entirely - the exact
      // opposite of what an audit trail is for.
      const pruned = pruneUnchanged(input.changes);
      // An empty diff means nothing happened. Suppress the row entirely.
      if (Object.keys(pruned).length === 0) return;
      changes = redactChanges(pruned);
    }

    const metadata = capMetadata(redact(input.metadata ?? {}));
    const { ip, userAgent } = await readRequestContext(input);

    const { error } = await createAdminClient().rpc('log_business_activity', {
      p_business_account_id: input.businessAccountId,
      p_action: input.action,
      p_category: definition.category,
      p_actor_type: input.actor.type,
      // undefined, not a placeholder: lets the RPC resolve the real name.
      p_actor_name: input.actor.name ?? undefined,
      p_actor_auth_user_id: input.actor.authUserId ?? undefined,
      p_actor_business_user_id: input.actor.businessUserId ?? undefined,
      p_actor_role: input.actor.role ?? undefined,
      p_actor_email: input.actor.email ?? undefined,
      p_severity: input.severity ?? definition.severity,
      p_entity_type: input.entity?.type ?? definition.entityType ?? undefined,
      p_entity_id: input.entity?.id ?? undefined,
      p_entity_label: input.entity?.label ?? undefined,
      // Both are plain JSON-serializable objects by construction (redact and
      // capMetadata only ever emit scalars, arrays and nested plain objects),
      // but the generated Json union does not model index signatures.
      p_changes: (changes ?? undefined) as Json | undefined,
      p_metadata: metadata as Json,
      p_amount: input.amount ?? undefined,
      p_currency: input.currency ?? undefined,
      p_ip_address: ip ?? undefined,
      p_user_agent: userAgent ?? undefined,
    });

    if (error) {
      console.error('[activity-log] write failed', input.action, error.message);
    }
  } catch (error) {
    // Second layer: the RPC swallows SQL errors, but not network, env or
    // serialization errors.
    console.error('[activity-log] unexpected failure', error);
  }
}

/** The minimum an auth context needs to expose for the logger to attribute a row. */
export interface ActivityLoggerContext {
  businessAccountId: string;
  userId?: string | null;
  businessId?: string | null;
  role?: string | null;
  memberName?: string | null;
  memberEmail?: string | null;
}

/**
 * Pre-binds tenant, actor and request context so a call site is one line.
 *
 * This is sugar, not a wrapper around requireBusinessAuth. A generic wrapper
 * could only ever log "POST /api/business/bookings 201"; it could not produce
 * "Booked BK-2026-0031 for Sarah Khan", because the booking number is generated
 * by a database trigger and exists only in the response body. Explicit call
 * sites keep the labels.
 */
export function activityLogger(context: ActivityLoggerContext, request?: Request) {
  return function log(
    action: BusinessActivityAction,
    details: Omit<BusinessActivityInput, 'businessAccountId' | 'action' | 'actor' | 'request'> & {
      actor?: Partial<BusinessActivityActor>;
    } = {}
  ): Promise<void> {
    const { actor: actorOverrides, ...rest } = details;
    return logBusinessActivity({
      ...rest,
      businessAccountId: context.businessAccountId,
      action,
      request,
      actor: {
        type: 'business_user',
        // Undefined when unknown, so the RPC resolves it from the database
        // rather than freezing a generic label into the row.
        name: context.memberName || context.memberEmail || undefined,
        authUserId: context.userId ?? null,
        businessUserId: context.businessId ?? null,
        role: context.role ?? null,
        email: context.memberEmail ?? null,
        ...actorOverrides,
      },
    });
  };
}

/**
 * Write many rows in one round trip.
 *
 * A bulk delete of 200 bookings must not be 200 calls. Every row in a batch
 * should share metadata.batch_id so the UI can collapse them into a single
 * entry, and each row still carries its own entity_id so the AFTER DELETE
 * trigger sees it and does not add a duplicate attributed to "Platform admin".
 *
 * Never throws, same contract as logBusinessActivity.
 */
export async function logBusinessActivityBatch(
  rows: Array<
    Omit<BusinessActivityInput, 'request' | 'skipRequestContext'> & { requestId?: string }
  >
): Promise<void> {
  try {
    if (!rows.length) return;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[activity-log] service role key not configured, skipping batch');
      return;
    }

    const payload = rows.map((row) => {
      const definition = getActivityDefinition(row.action);
      return {
        business_account_id: row.businessAccountId,
        actor_type: row.actor.type,
        actor_auth_user_id: row.actor.authUserId ?? null,
        actor_business_user_id: row.actor.businessUserId ?? null,
        actor_role: row.actor.role ?? null,
        actor_name: row.actor.name ?? null,
        actor_email: row.actor.email ?? null,
        action: row.action,
        category: definition.category,
        severity: row.severity ?? definition.severity,
        entity_type: row.entity?.type ?? definition.entityType ?? null,
        entity_id: row.entity?.id ?? null,
        entity_label: row.entity?.label ?? null,
        changes: row.changes ?? null,
        metadata: capMetadata(redact(row.metadata ?? {})),
        amount: row.amount ?? null,
        currency: row.currency ?? null,
        request_id: row.requestId ?? null,
      };
    });

    const { error } = await createAdminClient().rpc('log_business_activity_batch', {
      p_rows: payload as unknown as Json,
    });

    if (error) console.error('[activity-log] batch write failed', error.message);
  } catch (error) {
    console.error('[activity-log] unexpected batch failure', error);
  }
}

/** Build a changes object from a before and after snapshot of the same fields. */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): ActivityChanges {
  const changes: ActivityChanges = {};
  for (const key of Object.keys(after)) {
    changes[key] = { from: before[key] ?? null, to: after[key] ?? null };
  }
  return pruneUnchanged(changes);
}
