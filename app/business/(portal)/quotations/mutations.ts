'use server';

/**
 * Quotation write paths.
 *
 * Thin by design: validation lives in lib/business/quotations/schema, lifecycle rules in
 * status.ts, and persistence in persist.ts. A 'use server' module may only export async
 * functions, so no types or constants are exported from here.
 *
 * Every function returns a result object and never throws — the calling components rely on
 * that, matching app/vendor/direct-bookings/actions.ts.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember, restrictedToOwnBookings } from '@/lib/business/member-scope';
import { getExchangeRates } from '@/lib/currency/server';
import {
  quotationHeaderSchema,
  quotationTripSchema,
  quotationStatusChangeSchema,
  firstIssueMessage,
} from '@/lib/business/quotations/schema';
import {
  canEditHeader,
  canDelete,
  shouldRelockExchangeRate,
  normalizeQuotationStatus,
} from '@/lib/business/quotations/status';
import {
  saveQuotationTrips,
  computeStoredTotals,
  resolveExchangeRate,
} from '@/lib/business/quotations/persist';
import type { QuotationActionResult } from '@/lib/business/quotations/types';
import { z } from 'zod';

const LIST_PATH = '/business/quotations';

/** Resolve the caller and the quotation they are allowed to act on. */
async function loadScoped(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' as const };

  const member = await getBusinessMember(supabase, user.id);
  if (!member) return { error: 'Unauthorized' as const };

  const { data: quotation } = await supabase
    .from('business_quotations')
    .select('id, status, currency, default_markup_pct, discount_aed, created_by_user_id')
    .eq('id', id)
    .eq('business_account_id', member.businessAccountId)
    .maybeSingle();

  // 404-equivalent for a foreign id as well as a missing one, so ids cannot be probed.
  if (!quotation) return { error: 'Quotation not found' as const };

  if (restrictedToOwnBookings(member.role) && quotation.created_by_user_id !== member.id) {
    return { error: 'Quotation not found' as const };
  }

  return { supabase, member, quotation };
}

export async function createQuotation(input: unknown): Promise<QuotationActionResult> {
  try {
    const parsed = quotationHeaderSchema.safeParse(input);
    if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const member = await getBusinessMember(supabase, user.id);
    if (!member) return { error: 'Unauthorized' };

    const header = parsed.data;
    const rates = await getExchangeRates();

    const { data, error } = await supabase
      .from('business_quotations')
      .insert({
        business_account_id: member.businessAccountId,
        created_by_user_id: member.id,
        customer_name: header.customer_name,
        customer_company: header.customer_company ?? null,
        customer_email: header.customer_email ?? null,
        customer_phone: header.customer_phone ?? null,
        title: header.title ?? null,
        notes: header.notes ?? null,
        terms: header.terms ?? null,
        valid_until: header.valid_until ?? null,
        currency: header.currency,
        // Frozen now so a PDF already in a customer's hands never changes value.
        exchange_rate: resolveExchangeRate(header.currency, rates),
        default_markup_pct: header.default_markup_pct,
      })
      .select('id, quotation_number')
      .single();

    if (error || !data) {
      console.error('Error creating quotation:', error);
      return { error: 'Failed to create quotation' };
    }

    revalidatePath(LIST_PATH);
    return { success: true, id: data.id, quotation_number: data.quotation_number };
  } catch (error) {
    console.error('Error creating quotation:', error);
    return { error: 'Failed to create quotation' };
  }
}

export async function updateQuotation(
  id: string,
  headerInput: unknown,
  tripsInput: unknown
): Promise<QuotationActionResult> {
  try {
    const scoped = await loadScoped(id);
    if ('error' in scoped) return { error: scoped.error };
    const { supabase, member, quotation } = scoped;

    const status = normalizeQuotationStatus(quotation.status);
    if (!canEditHeader(status)) {
      return { error: 'This quotation is being converted and can no longer be edited' };
    }

    const header = quotationHeaderSchema.safeParse(headerInput);
    if (!header.success) return { error: firstIssueMessage(header.error) };

    const trips = z.array(quotationTripSchema).max(20).safeParse(tripsInput);
    if (!trips.success) return { error: firstIssueMessage(trips.error) };

    const saved = await saveQuotationTrips({
      supabase,
      quotationId: id,
      businessAccountId: member.businessAccountId,
      trips: trips.data,
      defaultMarkupPct: header.data.default_markup_pct,
    });
    if (saved.error) return { error: saved.error };

    const totals = computeStoredTotals(
      saved.lines,
      header.data.discount_aed,
      header.data.default_markup_pct
    );

    // Only re-rate while still a draft. Once sent, the customer holds a PDF with specific
    // numbers on it and silently re-rating underneath them is indefensible.
    const rates = shouldRelockExchangeRate(status) ? await getExchangeRates() : null;

    const { error } = await supabase
      .from('business_quotations')
      .update({
        customer_name: header.data.customer_name,
        customer_company: header.data.customer_company ?? null,
        customer_email: header.data.customer_email ?? null,
        customer_phone: header.data.customer_phone ?? null,
        title: header.data.title ?? null,
        notes: header.data.notes ?? null,
        terms: header.data.terms ?? null,
        valid_until: header.data.valid_until ?? null,
        currency: header.data.currency,
        default_markup_pct: header.data.default_markup_pct,
        ...(rates
          ? { exchange_rate: resolveExchangeRate(header.data.currency, rates) }
          : {}),
        ...totals,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating quotation:', error);
      return { error: 'Failed to save quotation' };
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { success: true, id };
  } catch (error) {
    console.error('Error updating quotation:', error);
    return { error: 'Failed to save quotation' };
  }
}

export async function setQuotationStatus(
  id: string,
  input: unknown
): Promise<QuotationActionResult> {
  try {
    const scoped = await loadScoped(id);
    if ('error' in scoped) return { error: scoped.error };
    const { supabase, quotation } = scoped;

    const parsed = quotationStatusChangeSchema.safeParse(input);
    if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

    const current = normalizeQuotationStatus(quotation.status);
    if (current === 'converting' || current === 'converted') {
      return { error: 'A converted quotation cannot change status' };
    }

    const next = parsed.data.status;
    const now = new Date().toISOString();

    // bq_status_timestamps requires the matching timestamp to be present, so they are always
    // written together.
    const { error } = await supabase
      .from('business_quotations')
      .update({
        status: next,
        ...(next === 'accepted' ? { accepted_at: now } : {}),
        ...(next === 'rejected' ? { rejected_at: now } : {}),
      })
      .eq('id', id);

    if (error) {
      console.error('Error changing quotation status:', error);
      return { error: 'Failed to update status' };
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { success: true, id };
  } catch (error) {
    console.error('Error changing quotation status:', error);
    return { error: 'Failed to update status' };
  }
}

export async function deleteQuotation(id: string): Promise<QuotationActionResult> {
  try {
    const scoped = await loadScoped(id);
    if ('error' in scoped) return { error: scoped.error };
    const { supabase, quotation } = scoped;

    const { count } = await supabase
      .from('business_quotation_items')
      .select('id', { count: 'exact', head: true })
      .eq('quotation_id', id)
      .not('converted_booking_id', 'is', null);

    const hasConverted = (count ?? 0) > 0;

    // The FK is RESTRICT so the database would refuse anyway; failing here gives a readable
    // message instead of a constraint violation.
    if (!canDelete(normalizeQuotationStatus(quotation.status), hasConverted)) {
      return {
        error: 'This quotation has trips that were already booked and cannot be deleted',
      };
    }

    const { error } = await supabase.from('business_quotations').delete().eq('id', id);
    if (error) {
      console.error('Error deleting quotation:', error);
      return { error: 'Failed to delete quotation' };
    }

    revalidatePath(LIST_PATH);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return { error: 'Failed to delete quotation' };
  }
}
