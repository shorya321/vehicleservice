'use server';

/**
 * Quotation read paths.
 *
 * Filtering and pagination happen IN SQL, following app/vendor/direct-bookings rather than
 * the business bookings list, which fetches every row and filters in JavaScript.
 *
 * A 'use server' module may only export async functions — a type exported from here would
 * break at runtime while tsc stays silent. All shapes live in lib/business/quotations/types.
 */

import { createClient } from '@/lib/supabase/server';
import { getBusinessMember, restrictedToOwnBookings } from '@/lib/business/member-scope';
import { bookingToday } from '@/lib/utils/timezone';
import { normalizeQuotationStatus, isQuotationExpired } from '@/lib/business/quotations/status';
import type {
  QuotationFilters,
  QuotationListResult,
  QuotationListRow,
  QuotationWithItems,
  QuotationItemWithAddons,
  QuotationStats,
} from '@/lib/business/quotations/types';

/** Columns the list needs. Narrow on purpose — the list never renders trip detail. */
const LIST_COLUMNS = `
  id, quotation_number, customer_name, customer_company, status, valid_until,
  currency, exchange_rate, total_sell_aed, created_at, updated_at, created_by_user_id
`;

export async function getQuotations(
  filters: QuotationFilters = {}
): Promise<QuotationListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: QuotationListResult = { rows: [], total: 0, page: 1, limit: 20 };
  if (!user) return empty;

  const member = await getBusinessMember(supabase, user.id);
  if (!member) return empty;

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const from = (page - 1) * limit;

  let query = supabase
    .from('business_quotations')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('business_account_id', member.businessAccountId);

  // Staff see only what they created. RLS enforces this too; doing it here as well keeps the
  // count accurate rather than counting rows the reader cannot see.
  if (restrictedToOwnBookings(member.role)) {
    query = query.eq('created_by_user_id', member.id);
  }

  if (filters.search) {
    // Escape PostgREST's or() delimiters before interpolation.
    const term = filters.search.replace(/[,()]/g, ' ').trim();
    if (term) {
      query = query.or(
        `quotation_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_company.ilike.%${term}%`
      );
    }
  }

  // 'expired' is derived, not stored, so it filters on the underlying condition instead.
  if (filters.status === 'expired') {
    query = query.in('status', ['draft', 'sent']).lt('valid_until', bookingToday());
  } else if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.fromDate) query = query.gte('created_at', filters.fromDate);
  if (filters.toDate) query = query.lte('created_at', `${filters.toDate}T23:59:59.999Z`);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    console.error('Error loading quotations:', error);
    return { ...empty, page, limit };
  }

  const ids = (data ?? []).map((row) => row.id);

  // Counted in a second round trip rather than an embedded aggregate: quotation items join
  // their parent on a COMPOSITE key, which PostgREST does not reliably auto-embed.
  const countByQuotation = new Map<string, number>();
  if (ids.length > 0) {
    const { data: itemRows } = await supabase
      .from('business_quotation_items')
      .select('quotation_id')
      .in('quotation_id', ids);

    for (const row of itemRows ?? []) {
      countByQuotation.set(row.quotation_id, (countByQuotation.get(row.quotation_id) ?? 0) + 1);
    }
  }

  const rows: QuotationListRow[] = (data ?? []).map((row) => ({
    id: row.id,
    quotation_number: row.quotation_number,
    customer_name: row.customer_name,
    customer_company: row.customer_company,
    status: normalizeQuotationStatus(row.status),
    valid_until: row.valid_until,
    currency: row.currency,
    exchange_rate: Number(row.exchange_rate),
    total_sell_aed: Number(row.total_sell_aed),
    item_count: countByQuotation.get(row.id) ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by_user_id: row.created_by_user_id,
  }));

  return { rows, total: count ?? 0, page, limit };
}

/**
 * One quotation with its trips and addons.
 * Returns null when it does not exist OR the member may not see it — the caller should
 * notFound() either way, so an id cannot be probed for existence.
 */
export async function getQuotation(id: string): Promise<QuotationWithItems | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const member = await getBusinessMember(supabase, user.id);
  if (!member) return null;

  const { data: quotation, error } = await supabase
    .from('business_quotations')
    .select('*')
    .eq('id', id)
    .eq('business_account_id', member.businessAccountId)
    .maybeSingle();

  if (error || !quotation) return null;

  if (
    restrictedToOwnBookings(member.role) &&
    quotation.created_by_user_id !== member.id
  ) {
    return null;
  }

  const { data: items } = await supabase
    .from('business_quotation_items')
    .select('*')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true });

  const itemIds = (items ?? []).map((i) => i.id);

  const addonsByItem = new Map<string, QuotationItemWithAddons['addons']>();
  if (itemIds.length > 0) {
    const { data: addonRows } = await supabase
      .from('business_quotation_item_addons')
      .select('item_id, addon_id, name_snapshot, quantity, unit_price, total_price')
      .in('item_id', itemIds);

    for (const row of addonRows ?? []) {
      const list = addonsByItem.get(row.item_id) ?? [];
      list.push({
        addon_id: row.addon_id,
        name_snapshot: row.name_snapshot,
        quantity: row.quantity,
        unit_price: Number(row.unit_price),
        total_price: Number(row.total_price),
      });
      addonsByItem.set(row.item_id, list);
    }
  }

  return {
    ...quotation,
    items: (items ?? []).map((item) => ({
      ...item,
      addons: addonsByItem.get(item.id) ?? [],
    })),
  };
}

/** Headline counts for the list page. */
export async function getQuotationStats(): Promise<QuotationStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty = { total: 0, draft: 0, sent: 0, accepted: 0, expired: 0 };
  if (!user) return empty;

  const member = await getBusinessMember(supabase, user.id);
  if (!member) return empty;

  let query = supabase
    .from('business_quotations')
    .select('status, valid_until')
    .eq('business_account_id', member.businessAccountId);

  if (restrictedToOwnBookings(member.role)) {
    query = query.eq('created_by_user_id', member.id);
  }

  const { data, error } = await query;
  if (error || !data) return empty;

  const today = bookingToday();
  const stats = { ...empty, total: data.length };

  for (const row of data) {
    const status = normalizeQuotationStatus(row.status);
    // Expiry is derived, so an expired quotation is counted as expired rather than as the
    // draft/sent it still is in the database.
    if (isQuotationExpired(status, row.valid_until, today)) {
      stats.expired += 1;
      continue;
    }
    if (status === 'draft') stats.draft += 1;
    else if (status === 'sent') stats.sent += 1;
    else if (status === 'accepted') stats.accepted += 1;
  }

  return stats;
}
