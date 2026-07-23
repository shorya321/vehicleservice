/**
 * Quotation PDF Download API
 * GET: Render a quotation as a branded, customer-facing PDF.
 *
 * The .select() below deliberately omits every net_* column. Combined with the narrow
 * QuotationPdfSource type, the business's internal cost cannot reach this document even by
 * accident — passing one would not compile.
 *
 * Uses the cookie-scoped client rather than the service-role client, so RLS enforces tenant
 * and creator scoping in addition to the explicit checks here.
 */

import type { NextResponse } from 'next/server';
import { jsx } from 'react/jsx-runtime';
import { createClient } from '@/lib/supabase/server';
import { requireBusinessAuth, apiError } from '@/lib/business/api-utils';
import { generatePDFBuffer, getPDFDownloadHeaders } from '@/lib/pdf/utils/pdf-generator';
import { QuotationPDF } from '@/lib/pdf/generators/quotation';
import {
  buildQuotationPdfData,
  type QuotationPdfSourceItem,
} from '@/lib/business/quotations/pdf-payload';
import { resolveBrandLogo } from '@/lib/business/quotations/brand-logo';

export const dynamic = 'force-dynamic';

export const GET = requireBusinessAuth(async (
  _request: Request,
  user,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Sell-side columns only. net_base_price_aed / net_addons_price_aed / net_total_aed are
    // absent by design - see the file header.
    const { data: quotation, error: quotationError } = await supabase
      .from('business_quotations')
      .select(
        `id, quotation_number, created_at, updated_at, valid_until, currency, exchange_rate,
         customer_name, customer_company, customer_email, customer_phone,
         discount_aed, terms, notes, created_by_user_id, business_account_id`
      )
      .eq('id', id)
      .eq('business_account_id', user.businessAccountId)
      .maybeSingle();

    if (quotationError) {
      console.error('Error loading quotation for PDF:', quotationError);
      return apiError('Failed to load quotation', 500);
    }

    if (!quotation) {
      return apiError('Quotation not found', 404);
    }

    // Staff see only what they created. 404 rather than 403 so an id cannot be probed for
    // existence - same reasoning as the team API.
    if (user.role !== 'owner' && quotation.created_by_user_id !== user.businessId) {
      return apiError('Quotation not found', 404);
    }

    // Fetched separately rather than embedded: business_quotation_items joins its parent on a
    // COMPOSITE key (quotation_id, business_account_id), which PostgREST does not reliably
    // auto-embed.
    const { data: items, error: itemsError } = await supabase
      .from('business_quotation_items')
      .select(
        `id, sort_order, from_location_id, to_location_id, pickup_address, dropoff_address,
         pickup_datetime, vehicle_type_id, passenger_count, adults, children, infants,
         description, sell_total_aed`
      )
      .eq('quotation_id', id)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('Error loading quotation items for PDF:', itemsError);
      return apiError('Failed to load quotation items', 500);
    }

    if (!items || items.length === 0) {
      return apiError('This quotation has no trips to render', 400);
    }

    const itemIds = items.map((i) => i.id);

    // Names only - addon PRICES are never rendered, so they are never selected.
    const { data: addonRows } = await supabase
      .from('business_quotation_item_addons')
      .select('item_id, name_snapshot')
      .in('item_id', itemIds);

    const addonsByItem = new Map<string, Array<{ name_snapshot: string }>>();
    for (const row of addonRows ?? []) {
      const list = addonsByItem.get(row.item_id) ?? [];
      list.push({ name_snapshot: row.name_snapshot });
      addonsByItem.set(row.item_id, list);
    }

    const locationIds = Array.from(
      new Set(items.flatMap((i) => [i.from_location_id, i.to_location_id]))
    );
    const vehicleIds = Array.from(new Set(items.map((i) => i.vehicle_type_id)));

    const [businessResult, locationsResult, vehiclesResult] = await Promise.all([
      supabase
        .from('business_accounts')
        .select('business_name, brand_name, business_email, business_phone, address, logo_url, theme_config')
        .eq('id', user.businessAccountId)
        .single(),
      supabase.from('locations').select('id, name').in('id', locationIds),
      supabase.from('vehicle_types').select('id, name').in('id', vehicleIds),
    ]);

    if (businessResult.error || !businessResult.data) {
      return apiError('Business account not found', 404);
    }

    const business = businessResult.data;

    const locationNames: Record<string, string> = {};
    for (const loc of locationsResult.data ?? []) locationNames[loc.id] = loc.name;

    const vehicleNames: Record<string, string> = {};
    for (const veh of vehiclesResult.data ?? []) vehicleNames[veh.id] = veh.name;

    // Returns null for SVG/webp, oversize, timeout or any failure. The document then renders
    // a typographic wordmark instead of crashing on an image @react-pdf cannot draw.
    const logo = await resolveBrandLogo(business.logo_url);

    const sourceItems: QuotationPdfSourceItem[] = items.map((item) => ({
      sort_order: item.sort_order,
      from_location_id: item.from_location_id,
      to_location_id: item.to_location_id,
      pickup_address: item.pickup_address,
      dropoff_address: item.dropoff_address,
      pickup_datetime: item.pickup_datetime,
      vehicle_type_id: item.vehicle_type_id,
      passenger_count: item.passenger_count,
      adults: item.adults,
      children: item.children,
      infants: item.infants,
      description: item.description,
      sell_total_aed: Number(item.sell_total_aed),
      addons: addonsByItem.get(item.id) ?? [],
    }));

    const pdfData = buildQuotationPdfData({
      quotation: {
        quotation_number: quotation.quotation_number,
        created_at: quotation.created_at,
        updated_at: quotation.updated_at,
        valid_until: quotation.valid_until,
        currency: quotation.currency,
        exchange_rate: Number(quotation.exchange_rate),
        customer_name: quotation.customer_name,
        customer_company: quotation.customer_company,
        customer_email: quotation.customer_email,
        customer_phone: quotation.customer_phone,
        discount_aed: Number(quotation.discount_aed),
        terms: quotation.terms,
        notes: quotation.notes,
        items: sourceItems,
      },
      business,
      logo,
      locationNames,
      vehicleNames,
    });

    const pdfBuffer = await generatePDFBuffer(jsx(QuotationPDF, pdfData));

    const fileName = `quotation-${quotation.quotation_number.replace(/[^a-zA-Z0-9-]/g, '_')}`;

    // Cast: requireBusinessAuth is typed for JSON handlers (NextResponse), but this route
    // returns a binary body. The sibling wallet PDF routes hit the same clash and simply
    // leave it as a type error; casting keeps this route clean without touching the shared
    // wrapper, which the whole business module depends on.
    return new Response(new Uint8Array(pdfBuffer), {
      headers: getPDFDownloadHeaders(fileName),
    }) as unknown as NextResponse;
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    return apiError('Failed to generate quotation PDF', 500);
  }
});
