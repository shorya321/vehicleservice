/**
 * Edit a quotation's trips and pricing.
 *
 * Editing stays open through `sent` and `accepted`. Customers renegotiate after saying yes,
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
import { canEditHeader, normalizeQuotationStatus } from '@/lib/business/quotations/status';
import { PageHeader } from '@/app/business/(portal)/components/ui/page-header';
import { getQuotation } from '../../actions';
import { QuotationBuilder } from './components/quotation-builder';
import { getBusinessTripSettings } from '@/lib/business/trips/settings-server';
import { tripDraftFromItem } from './trip-draft-from-item';

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
    new Set(
      quotation.items.flatMap((i) => [
        i.from_location_id,
        i.to_location_id,
        ...(i.legs ?? []).flatMap((l) => [l.from_location_id, l.to_location_id]),
      ])
    )
  ).filter((locationId): locationId is string => Boolean(locationId));
  const vehicleIds = Array.from(
    new Set(
      quotation.items.flatMap((i) => [
        i.vehicle_type_id,
        ...(i.vehicle_options ?? []).map((o) => o.vehicle_type_id),
      ])
    )
  );

  const [locationsResult, vehiclesResult, tripSettings] = await Promise.all([
    locationIds.length
      ? supabase.from('locations').select('id, name').in('id', locationIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    vehicleIds.length
      ? supabase.from('vehicle_types').select('id, name, image_url').in('id', vehicleIds)
      : Promise.resolve({
          data: [] as { id: string; name: string; image_url: string | null }[],
        }),
    getBusinessTripSettings(supabase),
  ]);

  const locationNames = new Map(
    (locationsResult.data ?? []).map((l) => [l.id, l.name] as const)
  );
  const vehicleNames = new Map(
    (vehiclesResult.data ?? []).map((v) => [v.id, v.name] as const)
  );
  const vehicleImages = new Map(
    (vehiclesResult.data ?? []).map((v) => [v.id, v.image_url] as const)
  );

  const initialTrips = quotation.items.map((item) =>
    tripDraftFromItem(item, { locationNames, vehicleNames, vehicleImages })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Quotation"
        breadcrumb={
          <nav className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/business/quotations/${id}`}
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Quotation</span>
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">{quotation.quotation_number}</span>
          </nav>
        }
        description={`${quotation.customer_name} · quoted in ${quotation.currency}`}
      />

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
        tripSettings={tripSettings}
      />
    </div>
  );
}
