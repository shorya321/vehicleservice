/**
 * Server-side price calculation for business bookings.
 * Used by both the quote action and booking API for consistent pricing.
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface PriceCalculationParams {
  fromLocationId: string;
  toLocationId: string;
  vehicleTypeId: string;
  /** Every guest (adults + children + infants). Each occupies a seat. */
  passengerCount: number;
  selectedAddons?: Array<{ addon_id: string; quantity: number; child_ages?: number[] }>;
  /**
   * The child/infant split behind `passengerCount`. Required whenever a selected addon has
   * `requires_child_age`. Child seats are capped at children + infants. Optional so the callers
   * that never sell child seats (price previews) need no change; omitting it when a child seat IS
   * selected is rejected outright rather than silently skipping the cap.
   */
  children?: number;
  infants?: number;
}

interface VerifiedAddon {
  addon_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  /** One age per seat for child-seat addons; null for everything else. */
  child_ages: number[] | null;
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
    .select('business_price_multiplier, price_multiplier, passenger_capacity')
    .eq('id', params.vehicleTypeId)
    .eq('is_active', true)
    .single();

  if (!vehicleType) {
    return { error: 'Vehicle type not found or inactive' };
  }

  // The vehicle search filters by capacity, but that gate is client-driven. Re-check here so a
  // crafted or replayed request cannot book more guests than the vehicle can legally carry.
  if (params.passengerCount > vehicleType.passenger_capacity) {
    return {
      error: `This vehicle seats ${vehicleType.passenger_capacity}; the booking is for ${params.passengerCount} guests.`,
    };
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
      .select('id, name, price, is_active, pricing_type, max_quantity, requires_child_age')
      .in('id', addonIds);

    if (!dbAddons) {
      return { error: 'Failed to verify addons' };
    }

    const addonMap = new Map(
      dbAddons.map(
        (a: {
          id: string;
          name: string;
          price: number;
          is_active: boolean;
          pricing_type: string;
          max_quantity: number | null;
          requires_child_age: boolean;
        }) => [a.id, a]
      )
    );

    // Counts seats across every age-requiring addon, checked against children + infants below.
    let ageSeatsRequested = 0;

    for (const selected of params.selectedAddons) {
      const dbAddon = addonMap.get(selected.addon_id);
      if (!dbAddon) {
        return { error: `Addon ${selected.addon_id} not found` };
      }
      if (!dbAddon.is_active) {
        return { error: `Addon ${selected.addon_id} is no longer available` };
      }

      // Enforce the addon's own quantity rule. `fixed` addons are a toggle in the UI, so their
      // quantity is always 1; `per_unit` addons are capped at the admin-configured max_quantity.
      // The client enforces both, so a violation here is a bug or a tampered request. Reject it
      // rather than silently rewriting it into a different order.
      const maxAllowed = dbAddon.pricing_type === 'fixed' ? 1 : dbAddon.max_quantity ?? 1;
      if (selected.quantity > maxAllowed) {
        return { error: `${dbAddon.name}: maximum quantity is ${maxAllowed}` };
      }

      // Child seats need one age per seat. Checked here rather than only at the insert, because
      // the insert runs after the wallet has already been debited by the RPC.
      let childAges: number[] | null = null;
      if (dbAddon.requires_child_age) {
        const ages = selected.child_ages ?? [];
        if (ages.length !== selected.quantity) {
          return { error: `${dbAddon.name}: one child age is required per seat` };
        }
        if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 12)) {
          return { error: `${dbAddon.name}: child age must be between 0 and 12` };
        }
        childAges = ages;
        ageSeatsRequested += selected.quantity;
      }

      const unitPrice = dbAddon.price;
      const totalAddonPrice = unitPrice * selected.quantity;
      addonsPrice += totalAddonPrice;

      verifiedAddons.push({
        addon_id: selected.addon_id,
        name: dbAddon.name,
        quantity: selected.quantity,
        unit_price: unitPrice,
        total_price: totalAddonPrice,
        child_ages: childAges,
      });
    }

    if (ageSeatsRequested > 0) {
      // A caller that sells child seats must tell us the breakdown. Failing loudly beats silently
      // skipping the cap for a caller that simply forgot to pass it.
      if (params.children === undefined || params.infants === undefined) {
        return { error: 'Guest breakdown (children and infants) is required to book a child seat' };
      }
      const childSeatCapacity = params.children + params.infants;
      if (ageSeatsRequested > childSeatCapacity) {
        return {
          error: `${ageSeatsRequested} child seat(s) selected but the booking has ${childSeatCapacity} child/infant guest(s)`,
        };
      }
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
