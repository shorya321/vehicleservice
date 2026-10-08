import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Add-on and child-seat verification for business trips.
 * SCOPE: Business module ONLY.
 *
 * Same rules as the add-on half of lib/business/price-calculation.ts (which stays untouched for
 * one-way bookings): prices re-read from the DB, quantity caps, one age per child seat, seats
 * capped at children + infants and required for every child or infant.
 *
 * On a trip the add-ons travel on every journey (the same passengers ride each one), so the
 * caller charges `perJourney` once per journey.
 */
export interface BusinessTripAddonSelection {
  addon_id: string;
  quantity: number;
  child_ages?: number[];
}

export interface BusinessVerifiedAddon {
  addon_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  child_ages: number[] | null;
}

export type BusinessAddonVerification =
  | { ok: true; addons: BusinessVerifiedAddon[]; perJourney: number }
  | { ok: false; error: string };

interface AddonRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  pricing_type: string;
  max_quantity: number | null;
  requires_child_age: boolean;
}

export async function verifyBusinessTripAddons(
  supabase: SupabaseClient,
  selected: BusinessTripAddonSelection[],
  guests: { children: number; infants: number }
): Promise<BusinessAddonVerification> {
  const childSeatCapacity = guests.children + guests.infants;
  const addons: BusinessVerifiedAddon[] = [];
  let perJourney = 0;
  let ageSeats = 0;

  if (selected.length > 0) {
    const { data, error } = await supabase
      .from('addons')
      .select('id, name, price, is_active, pricing_type, max_quantity, requires_child_age')
      .in('id', selected.map((a) => a.addon_id));

    if (error || !data) return { ok: false, error: 'Failed to verify addons' };
    const byId = new Map((data as AddonRow[]).map((row) => [row.id, row]));

    for (const pick of selected) {
      const row = byId.get(pick.addon_id);
      if (!row) return { ok: false, error: `Addon ${pick.addon_id} not found` };
      if (!row.is_active) return { ok: false, error: `Addon ${pick.addon_id} is no longer available` };

      const maxAllowed = row.pricing_type === 'fixed' ? 1 : row.max_quantity ?? 1;
      if (pick.quantity > maxAllowed) return { ok: false, error: `${row.name}: maximum quantity is ${maxAllowed}` };

      let childAges: number[] | null = null;
      if (row.requires_child_age) {
        const ages = pick.child_ages ?? [];
        if (ages.length !== pick.quantity) return { ok: false, error: `${row.name}: one child age is required per seat` };
        if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 12)) {
          return { ok: false, error: `${row.name}: child age must be between 0 and 12` };
        }
        childAges = ages;
        ageSeats += pick.quantity;
      }

      const unitPrice = Number(row.price);
      const total = unitPrice * pick.quantity;
      perJourney += total;
      addons.push({
        addon_id: pick.addon_id,
        name: row.name,
        quantity: pick.quantity,
        unit_price: unitPrice,
        total_price: total,
        child_ages: childAges,
      });
    }
  }

  if (ageSeats > childSeatCapacity) {
    return {
      ok: false,
      error: `${ageSeats} child seat(s) selected but the booking has ${childSeatCapacity} child/infant guest(s)`,
    };
  }
  if (ageSeats < childSeatCapacity) {
    return {
      ok: false,
      error: `${childSeatCapacity} child/infant guest(s) on this booking but only ${ageSeats} child seat(s) selected`,
    };
  }

  return { ok: true, addons, perJourney };
}
