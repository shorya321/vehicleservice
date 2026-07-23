/**
 * Edit a quotation's trips and pricing.
 *
 * Editing stays open through `sent` and `accepted` — customers renegotiate after saying yes,
 * and forcing a brand-new quotation for a changed pickup time is the kind of friction that
 * pushes people back to WhatsApp. Only a conversion in flight closes it, and individual trips
 * lock as soon as they become real bookings.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { Button } from '@/components/ui/button';
import { canEditHeader, normalizeQuotationStatus } from '@/lib/business/quotations/status';
import { getQuotation } from '../../actions';
import { QuotationBuilder } from './components/quotation-builder';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

export const metadata: Metadata = {
  title: 'Edit Quotation | Business Portal',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotationPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/business/login');

  const member = await getBusinessMember(supabase, user.id);
  if (!member) redirect('/business/login');

  const quotation = await getQuotation(id);
  if (!quotation) notFound();

  const status = normalizeQuotationStatus(quotation.status);
  // A conversion in flight owns these rows; send the user to the read-only view instead.
  if (!canEditHeader(status)) {
    redirect(`/business/quotations/${id}`);
  }

  // Resolve display names so trips read as places rather than UUIDs.
  const locationIds = Array.from(
    new Set(quotation.items.flatMap((i) => [i.from_location_id, i.to_location_id]))
  );
  const vehicleIds = Array.from(new Set(quotation.items.map((i) => i.vehicle_type_id)));

  const [locationsResult, vehiclesResult] = await Promise.all([
    locationIds.length
      ? supabase.from('locations').select('id, name').in('id', locationIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    vehicleIds.length
      ? supabase.from('vehicle_types').select('id, name').in('id', vehicleIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const locationNames = new Map(
    (locationsResult.data ?? []).map((l) => [l.id, l.name] as const)
  );
  const vehicleNames = new Map(
    (vehiclesResult.data ?? []).map((v) => [v.id, v.name] as const)
  );

  const initialTrips: QuotationTripDraft[] = quotation.items.map((item) => ({
    id: item.id,
    sort_order: item.sort_order,
    from_location_id: item.from_location_id,
    to_location_id: item.to_location_id,
    from_location_name: locationNames.get(item.from_location_id),
    to_location_name: locationNames.get(item.to_location_id),
    pickup_address: item.pickup_address,
    dropoff_address: item.dropoff_address,
    pickup_datetime: item.pickup_datetime,
    vehicle_type_id: item.vehicle_type_id,
    vehicle_type_name: vehicleNames.get(item.vehicle_type_id),
    passenger_count: item.passenger_count,
    adults: item.adults,
    children: item.children,
    infants: item.infants,
    description: item.description,
    addons: item.addons,
    net_base_price_aed: Number(item.net_base_price_aed),
    net_addons_price_aed: Number(item.net_addons_price_aed),
    net_total_aed: Number(item.net_total_aed),
    sell_total_aed: Number(item.sell_total_aed),
    price_mode: item.price_mode as QuotationTripDraft['price_mode'],
    markup_percent: item.markup_percent === null ? null : Number(item.markup_percent),
    converted_booking_id: item.converted_booking_id,
    converted_booking_number: item.converted_booking_number,
  }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/business/quotations/${id}`} aria-label="Back to quotation">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {quotation.quotation_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {quotation.customer_name} · quoted in {quotation.currency}
          </p>
        </div>
      </div>

      <QuotationBuilder
        quotationId={quotation.id}
        businessAccountId={member.businessAccountId}
        currency={quotation.currency}
        exchangeRate={Number(quotation.exchange_rate)}
        header={{
          customer_name: quotation.customer_name,
          customer_company: quotation.customer_company ?? undefined,
          customer_email: quotation.customer_email ?? undefined,
          customer_phone: quotation.customer_phone ?? undefined,
          title: quotation.title ?? undefined,
          notes: quotation.notes ?? undefined,
          terms: quotation.terms ?? undefined,
          valid_until: quotation.valid_until ?? undefined,
          default_markup_pct: Number(quotation.default_markup_pct),
          discount_aed: Number(quotation.discount_aed),
        }}
        initialTrips={initialTrips}
      />
    </div>
  );
}
