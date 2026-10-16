/**
 * A stored quotation trip as the builder holds it in memory.
 * SCOPE: Business module ONLY
 */

import { businessTripTypeOf } from '@/lib/business/trips/display';
import { isBusinessHourlyPackage } from '@/lib/business/trips/types';
import type { QuotationItemWithAddons, QuotationTripDraft } from '@/lib/business/quotations/types';

interface Lookups {
  locationNames: ReadonlyMap<string, string>;
  vehicleNames: ReadonlyMap<string, string>;
  vehicleImages: ReadonlyMap<string, string | null>;
}

export function tripDraftFromItem(
  item: QuotationItemWithAddons,
  { locationNames, vehicleNames, vehicleImages }: Lookups
): QuotationTripDraft {
  const toLocationId = item.to_location_id ?? '';
  // Hourly stores "As directed" as its dropoff; it is not an address the editor should carry
  // into another trip type.
  const dropoff = item.trip_type === 'hourly' ? '' : item.dropoff_address ?? '';
  return {
    id: item.id,
    sort_order: item.sort_order,
    trip_type: businessTripTypeOf(item),
    legs: (item.legs ?? []).map((leg) => ({
      from_location_id: leg.from_location_id,
      to_location_id: leg.to_location_id,
      from_location_name: locationNames.get(leg.from_location_id),
      to_location_name: locationNames.get(leg.to_location_id),
      pickup_address: leg.pickup_address,
      dropoff_address: leg.dropoff_address,
      pickup_datetime: leg.pickup_datetime,
    })),
    hourly_package: isBusinessHourlyPackage(item.hourly_package) ? item.hourly_package : null,
    duration_hours: item.duration_hours === null ? null : Number(item.duration_hours),
    included_km: item.included_km,
    from_location_id: item.from_location_id,
    to_location_id: toLocationId,
    from_location_name: locationNames.get(item.from_location_id),
    to_location_name: toLocationId ? locationNames.get(toLocationId) : undefined,
    pickup_address: item.pickup_address,
    dropoff_address: dropoff,
    pickup_datetime: item.pickup_datetime,
    vehicle_type_id: item.vehicle_type_id,
    vehicle_type_name: vehicleNames.get(item.vehicle_type_id),
    vehicle_type_image: vehicleImages.get(item.vehicle_type_id) ?? null,
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
    vehicle_options: (item.vehicle_options ?? []).map((option) => ({
      vehicle_type_id: option.vehicle_type_id,
      vehicle_type_name: vehicleNames.get(option.vehicle_type_id),
      vehicle_type_image: vehicleImages.get(option.vehicle_type_id) ?? null,
      net_base_price_aed: option.net_base_price_aed,
    })),
    converted_booking_id: item.converted_booking_id,
    converted_booking_number: item.converted_booking_number,
  };
}
