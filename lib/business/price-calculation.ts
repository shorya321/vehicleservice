/**
 * Server-side price calculation for business bookings.
 * Used by both the quote action and booking API for consistent pricing.
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface PriceCalculationParams {
  fromLocationId: string;
  toLocationId: string;
  vehicleTypeId: string;
  selectedAddons?: Array<{ addon_id: string; quantity: number }>;
}

interface VerifiedAddon {
  addon_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PriceCalculationResult {
  basePrice: number;
  addonsPrice: number;
  totalPrice: number;
  verifiedAddons: VerifiedAddon[];
  fromZoneId: string;
  toZoneId: string;
}

interface PriceCalculationError {
  error: string;
}

export async function calculateBusinessBookingPrice(
  supabase: SupabaseClient,
  params: PriceCalculationParams
): Promise<PriceCalculationResult | PriceCalculationError> {
  // 1. Look up locations → zone IDs
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, zone_id')
    .in('id', [params.fromLocationId, params.toLocationId]);

  if (!locations || locations.length !== 2) {
    return { error: 'Invalid locations' };
  }

  const fromLocation = locations.find((l: { id: string }) => l.id === params.fromLocationId);
  const toLocation = locations.find((l: { id: string }) => l.id === params.toLocationId);

  if (!fromLocation?.zone_id || !toLocation?.zone_id) {
    return { error: 'Locations not configured with service zones' };
  }

  // 2. Get zone pricing
  const { data: zonePricing } = await supabase
    .from('zone_pricing')
    .select('base_price')
    .eq('from_zone_id', fromLocation.zone_id)
    .eq('to_zone_id', toLocation.zone_id)
    .eq('is_active', true)
    .single();

  if (!zonePricing) {
    return { error: 'No active pricing for this route' };
  }

  // 3. Get vehicle type multiplier
  const { data: vehicleType } = await supabase
    .from('vehicle_types')
    .select('business_price_multiplier, price_multiplier')
    .eq('id', params.vehicleTypeId)
    .eq('is_active', true)
    .single();

  if (!vehicleType) {
    return { error: 'Vehicle type not found or inactive' };
  }

  // 4. Calculate base price
  const multiplier = vehicleType.business_price_multiplier || vehicleType.price_multiplier || 1.0;
  const basePrice = zonePricing.base_price * multiplier;

  // 5. Verify addons
  let addonsPrice = 0;
  const verifiedAddons: VerifiedAddon[] = [];

  if (params.selectedAddons && params.selectedAddons.length > 0) {
    const addonIds = params.selectedAddons.map((a) => a.addon_id);
    const { data: dbAddons } = await supabase
      .from('addons')
      .select('id, price, is_active')
      .in('id', addonIds);

    if (!dbAddons) {
      return { error: 'Failed to verify addons' };
    }

    const addonMap = new Map(dbAddons.map((a: { id: string; price: number; is_active: boolean }) => [a.id, a]));

    for (const selected of params.selectedAddons) {
      const dbAddon = addonMap.get(selected.addon_id);
      if (!dbAddon) {
        return { error: `Addon ${selected.addon_id} not found` };
      }
      if (!dbAddon.is_active) {
        return { error: `Addon ${selected.addon_id} is no longer available` };
      }

      const unitPrice = dbAddon.price;
      const totalAddonPrice = unitPrice * selected.quantity;
      addonsPrice += totalAddonPrice;

      verifiedAddons.push({
        addon_id: selected.addon_id,
        quantity: selected.quantity,
        unit_price: unitPrice,
        total_price: totalAddonPrice,
      });
    }
  }

  return {
    basePrice,
    addonsPrice,
    totalPrice: basePrice + addonsPrice,
    verifiedAddons,
    fromZoneId: fromLocation.zone_id,
    toZoneId: toLocation.zone_id,
  };
}
