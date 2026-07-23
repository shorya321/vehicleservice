/**
 * Quotation row shapes and view models.
 *
 * These live here rather than in the server-action modules because a 'use server' file may
 * only export async functions — a type exported from one breaks at runtime while tsc stays
 * silent. app/business/(portal)/bookings/new/actions.ts does exactly that with
 * VehicleTypeResult, AddonItem and friends, so the quotation feature declares its own
 * structurally-compatible shapes below and imports only the *functions* from that module.
 */

import type { Database } from '@/lib/supabase/types';
import type { QuotationStatus } from './status';
import type { QuotationPriceMode } from './pricing';

type Tables = Database['public']['Tables'];

export type QuotationRow = Tables['business_quotations']['Row'];
export type QuotationInsert = Tables['business_quotations']['Insert'];
export type QuotationUpdate = Tables['business_quotations']['Update'];

export type QuotationItemRow = Tables['business_quotation_items']['Row'];
export type QuotationItemInsert = Tables['business_quotation_items']['Insert'];

export type QuotationItemAddonRow = Tables['business_quotation_item_addons']['Row'];

/** An addon as stored against a quotation line. */
export interface QuotationItemAddon {
  addon_id: string;
  name_snapshot: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

/** One trip, with its addons resolved. */
export interface QuotationItemWithAddons extends QuotationItemRow {
  addons: QuotationItemAddon[];
}

/** A quotation and everything needed to render or price it. */
export interface QuotationWithItems extends QuotationRow {
  items: QuotationItemWithAddons[];
}

/**
 * Denormalised row for the list page. Kept deliberately narrow — the list never needs the
 * per-trip detail, and selecting it for 50 rows is wasted bandwidth.
 */
export interface QuotationListRow {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_company: string | null;
  status: QuotationStatus;
  valid_until: string | null;
  currency: string;
  /** Locked AED -> currency rate, so the list can show the quoted currency. */
  exchange_rate: number;
  total_sell_aed: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
}

export interface QuotationFilters {
  search?: string;
  status?: QuotationStatus | 'all' | 'expired';
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface QuotationListResult {
  rows: QuotationListRow[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Standard action result. Mirrors the vendor direct-bookings shape so the calling components
 * behave identically: never throw, always return a discriminable object.
 */
export interface QuotationActionResult {
  success?: boolean;
  error?: string;
  id?: string;
  quotation_number?: string;
}

/**
 * Vehicle option as returned by getAvailableVehicleTypesForRoute().
 *
 * Declared locally on purpose (see the file header). Only the fields the quotation builder
 * actually consumes are listed — the HMAC signature fields that action also returns are
 * irrelevant here, because a quotation is not a booking and re-prices at conversion anyway.
 */
export interface QuotationVehicleOption {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  capacity: number;
  luggageCapacity: number;
  description: string;
  price: number;
  image?: string;
}

export interface QuotationVehicleGroup {
  categoryId: string;
  categoryName: string;
  vehicleTypes: QuotationVehicleOption[];
}

/** Addon option as returned by getActiveAddons(). Declared locally for the same reason. */
export interface QuotationAddonOption {
  id: string;
  name: string;
  price: number;
  category: string;
  pricing_type: string;
  max_quantity: number | null;
}

/** A trip as the builder holds it in memory, before it is persisted. */
export interface QuotationTripDraft {
  id?: string;
  sort_order: number;
  from_location_id: string;
  to_location_id: string;
  from_location_name?: string;
  to_location_name?: string;
  pickup_address: string;
  dropoff_address: string;
  /** ISO string, or null for an undated quote. Undated trips can never be converted. */
  pickup_datetime: string | null;
  vehicle_type_id: string;
  vehicle_type_name?: string;
  passenger_count: number;
  adults: number;
  children: number;
  infants: number;
  description: string | null;
  addons: QuotationItemAddon[];
  net_base_price_aed: number;
  net_addons_price_aed: number;
  net_total_aed: number;
  sell_total_aed: number;
  price_mode: QuotationPriceMode;
  markup_percent: number | null;
  /** Present only once the trip has become a booking; makes the line immutable. */
  converted_booking_id?: string | null;
  converted_booking_number?: string | null;
}

/** Per-line outcome of a conversion run. */
export interface QuotationConversionLineResult {
  itemId: string;
  status: 'converted' | 'already_converted' | 'failed';
  bookingId?: string;
  bookingNumber?: string;
  error?: string;
}

export interface QuotationConversionResult {
  success: boolean;
  quotationStatus: QuotationStatus;
  lines: QuotationConversionLineResult[];
  error?: string;
}

/**
 * A single line's repricing diff, surfaced before any booking is created.
 * `netAedFresh` is authoritative — the stored figure is only ever an estimate, because price
 * signatures expire after 30 minutes.
 */
export interface QuotationRepriceLine {
  itemId: string;
  /** Both addresses joined — kept for blocking-error messages, which are single strings. */
  label: string;
  pickup: string;
  dropoff: string;
  netAedStored: number;
  netAedFresh: number;
  sellAed: number;
  /** True when the refreshed cost has risen above what the customer was quoted. */
  belowCost: boolean;
  error?: string;
}

export interface QuotationPreflightResult {
  ok: boolean;
  lines: QuotationRepriceLine[];
  /** Hash binding a confirmation to the exact figures shown, defeating a TOCTOU re-price. */
  repriceToken: string;
  totalNetAed: number;
  blockingErrors: string[];
}
