/**
 * Pure helpers for the alternative vehicles a quotation trip may offer.
 *
 * Kept free of React and Supabase so the builder's rules are unit-testable under the repo's
 * `testEnvironment: 'node'` jest config.
 */

import { MAX_VEHICLE_OPTIONS } from './schema';
import type { QuotationVehicleOptionDraft } from './types';

/** The minimum a priced vehicle list entry must carry to back an option. */
export interface PricedVehicle {
  id: string;
  name: string;
  price: number;
}

/** True when another option may still be added to the trip. */
export function canAddVehicleOption(options: readonly QuotationVehicleOptionDraft[]): boolean {
  return options.length < MAX_VEHICLE_OPTIONS;
}

/**
 * Add the vehicle as an option, or remove it if it is already one. The quoted vehicle can never
 * be its own alternative, and the cap is enforced here as well as in the schema.
 */
export function toggleVehicleOption(
  options: readonly QuotationVehicleOptionDraft[],
  vehicle: PricedVehicle,
  mainVehicleId: string
): QuotationVehicleOptionDraft[] {
  if (vehicle.id === mainVehicleId) return [...options];
  if (options.some((o) => o.vehicle_type_id === vehicle.id)) {
    return options.filter((o) => o.vehicle_type_id !== vehicle.id);
  }
  if (!canAddVehicleOption(options)) return [...options];
  return [
    ...options,
    { vehicle_type_id: vehicle.id, vehicle_type_name: vehicle.name, net_base_price_aed: vehicle.price },
  ];
}

/** Drop the newly chosen main vehicle from the options, so it is never offered twice. */
export function withoutMainVehicle(
  options: readonly QuotationVehicleOptionDraft[],
  mainVehicleId: string
): QuotationVehicleOptionDraft[] {
  return options.filter((o) => o.vehicle_type_id !== mainVehicleId);
}

/**
 * Bring the options in line with a freshly loaded vehicle list: refresh each cost and name,
 * and drop any vehicle the route or guest count no longer allows. Call it only after a
 * SUCCESSFUL load; an empty list from a failed request would otherwise wipe every option.
 */
export function reconcileVehicleOptions(
  options: readonly QuotationVehicleOptionDraft[],
  vehicles: readonly PricedVehicle[],
  mainVehicleId: string
): QuotationVehicleOptionDraft[] {
  const byId = new Map(vehicles.map((v) => [v.id, v] as const));
  return options.flatMap((option) => {
    const vehicle = byId.get(option.vehicle_type_id);
    if (!vehicle || vehicle.id === mainVehicleId) return [];
    return [
      {
        vehicle_type_id: vehicle.id,
        vehicle_type_name: vehicle.name,
        net_base_price_aed: vehicle.price,
      },
    ];
  });
}
