/**
 * Quotation -> Bookings conversion API.
 *
 * GET  — preflight only. Re-prices every trip and checks every wallet rule. Creates nothing.
 * POST — takes the lock, re-runs preflight, then converts trip by trip.
 *
 * Ordering matters: lock, then preflight, then loop. Preflighting outside the lock would let
 * two tabs both pass and then both convert.
 */

import type { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireBusinessAuth, apiError, apiSuccess } from '@/lib/business/api-utils';
import { quotationConvertSchema } from '@/lib/business/quotations/schema';
import { preflightConversion, repriceToken } from '@/lib/business/quotations/convert';
import { convertQuotationItem } from '@/lib/business/quotations/convert-item';
import { normalizeQuotationStatus, canConvert } from '@/lib/business/quotations/status';
import type {
  ConvertibleItem,
  ConvertibleQuotation,
} from '@/lib/business/quotations/convert';
import type { QuotationConversionLineResult } from '@/lib/business/quotations/types';

export const dynamic = 'force-dynamic';

/** Abandoned locks are reclaimed after this. Safe because the nonce prevents double-charging. */
const STALE_LOCK_MINUTES = 10;

/**
 * Load the quotation and its trips, scoped to the caller.
 * Uses the admin client for the read so the service-role write path below sees the same rows,
 * with tenancy and creator scoping applied explicitly.
 */
async function loadForConversion(
  quotationId: string,
  businessAccountId: string,
  businessUserId: string,
  role: string
) {
  const admin = createAdminClient();

  const { data: quotation } = await admin
    .from('business_quotations')
    .select(
      'id, quotation_number, business_account_id, customer_name, customer_email, customer_phone, status, created_by_user_id, converting_started_at'
    )
    .eq('id', quotationId)
    .eq('business_account_id', businessAccountId)
    .maybeSingle();

  if (!quotation) return null;
  // 404-equivalent for a colleague's quotation so ids cannot be probed.
  if (role !== 'owner' && quotation.created_by_user_id !== businessUserId) return null;

  const { data: items } = await admin
    .from('business_quotation_items')
    .select(
      `id, from_location_id, to_location_id, pickup_address, dropoff_address, pickup_datetime,
       vehicle_type_id, passenger_count, adults, children, infants,
       net_total_aed, sell_total_aed, conversion_nonce, converted_booking_id`
    )
    .eq('quotation_id', quotationId)
    .order('sort_order', { ascending: true });

  const itemIds = (items ?? []).map((i) => i.id);
  const addonsByItem = new Map<string, Array<{ addon_id: string; quantity: number }>>();

  if (itemIds.length > 0) {
    const { data: addonRows } = await admin
      .from('business_quotation_item_addons')
      .select('item_id, addon_id, quantity')
      .in('item_id', itemIds);

    for (const row of addonRows ?? []) {
      const list = addonsByItem.get(row.item_id) ?? [];
      list.push({ addon_id: row.addon_id, quantity: row.quantity });
      addonsByItem.set(row.item_id, list);
    }
  }

  const convertible: ConvertibleItem[] = (items ?? []).map((item) => ({
    ...item,
    net_total_aed: Number(item.net_total_aed),
    sell_total_aed: Number(item.sell_total_aed),
    addons: addonsByItem.get(item.id) ?? [],
  }));

  return { admin, quotation, items: convertible };
}

export const GET = requireBusinessAuth(async (
  _request: Request,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const loaded = await loadForConversion(id, user.businessAccountId, user.businessId, user.role);
  if (!loaded) return apiError('Quotation not found', 404);

  const { admin, quotation, items } = loaded;
  const preflight = await preflightConversion(admin, quotation as ConvertibleQuotation, items);
  return apiSuccess(preflight);
});

export const POST = requireBusinessAuth(async (
  request: Request,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = quotationConvertSchema.safeParse(body);
    if (!parsed.success) return apiError('A repricing confirmation is required', 400);

    const loaded = await loadForConversion(
      id,
      user.businessAccountId,
      user.businessId,
      user.role
    );
    if (!loaded) return apiError('Quotation not found', 404);

    const { admin, quotation, items } = loaded;

    const status = normalizeQuotationStatus(quotation.status);
    if (!canConvert(status)) {
      return apiError('Only an accepted quotation can be converted into bookings', 409);
    }

    // Take the lock FIRST. Each attempt is a single conditional UPDATE whose rowcount we
    // inspect — a read-then-write would not be a lock at all.
    //
    // Deliberately TWO .eq() updates rather than one .or(): PostgREST cannot resolve a column
    // referenced in or() when the same UPDATE also SETs that column, and fails with
    // "column business_quotations.status does not exist" (42703). That error was previously
    // swallowed and reported as a 409, so conversion could never succeed and the message
    // blamed a concurrent run. Two plain equality filters are equally atomic.
    const staleBefore = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000).toISOString();
    const lockPatch = {
      status: 'converting',
      converting_started_at: new Date().toISOString(),
    };

    // 1. The normal path: claim it from the status it is currently in.
    let lock = await admin
      .from('business_quotations')
      .update(lockPatch)
      .eq('id', id)
      .eq('status', status)
      .select('id');

    // 2. Reclaim a lock abandoned by a crashed run. Safe because the per-trip nonce stops a
    //    retry from charging twice.
    if (!lock.error && (lock.data?.length ?? 0) === 0) {
      lock = await admin
        .from('business_quotations')
        .update(lockPatch)
        .eq('id', id)
        .eq('status', 'converting')
        .lt('converting_started_at', staleBefore)
        .select('id');
    }

    // Surface a real database failure instead of misreporting it as contention.
    if (lock.error) {
      console.error('Failed to acquire quotation conversion lock:', lock.error);
      return apiError('Could not start the conversion', 500);
    }

    if ((lock.data?.length ?? 0) === 0) {
      return apiError('This quotation is already being converted', 409);
    }

    // Re-run preflight INSIDE the lock, then bind it to what the user confirmed. Without this
    // the user could approve one set of prices and buy at another.
    const preflight = await preflightConversion(
      admin,
      quotation as ConvertibleQuotation,
      items
    );

    const releaseTo = status;

    if (!preflight.ok) {
      await admin
        .from('business_quotations')
        .update({ status: releaseTo, converting_started_at: null })
        .eq('id', id);
      return apiError(preflight.blockingErrors[0] ?? 'This quotation cannot be converted', 409);
    }

    const currentToken = repriceToken(id, preflight.lines);
    if (parsed.data.repriceToken !== currentToken) {
      await admin
        .from('business_quotations')
        .update({ status: releaseTo, converting_started_at: null })
        .eq('id', id);
      return apiError(
        'Prices changed since you reviewed them. Please review the updated figures.',
        409
      );
    }

    const pending = items.filter((item) => !item.converted_booking_id);
    const results: QuotationConversionLineResult[] = [];

    // Sequential on purpose: each RPC takes FOR UPDATE on the same business_accounts row, so
    // parallelism would only create lock contention on the wallet.
    for (const item of pending) {
      const result = await convertQuotationItem({
        admin,
        quotation: quotation as ConvertibleQuotation,
        item,
        createdByUserId: user.businessId,
      });
      results.push(result);
      // Stop at the first hard failure: the wallet may be exhausted, and every later trip
      // would fail the same way while charging for the ones before it.
      if (result.status === 'failed') break;
    }

    const converted = results.filter((r) => r.status !== 'failed').length;
    const alreadyDone = items.length - pending.length;
    const allDone = converted + alreadyDone === items.length;

    // Never roll back a partial run: those bookings are real and already paid for.
    const finalStatus = allDone ? 'converted' : 'partially_converted';

    await admin
      .from('business_quotations')
      .update({
        status: finalStatus,
        converting_started_at: null,
        ...(allDone ? { converted_at: new Date().toISOString() } : {}),
      })
      .eq('id', id);

    return apiSuccess({
      success: allDone,
      quotationStatus: finalStatus,
      lines: results,
    });
  } catch (error) {
    console.error('Quotation conversion failed:', error);
    return apiError('Conversion failed', 500);
  }
}) as unknown as (request: Request, context: unknown) => Promise<NextResponse>;
