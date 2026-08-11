/**
 * Loads the facts a business-booking email needs, from a booking id.
 *
 * Written for the quotation conversion path, which creates bookings through an RPC and so
 * has only ids to work from afterwards.
 *
 * Note that app/admin/bookings/actions.ts and app/vendor/bookings/actions.ts each carry a
 * near-identical local lookup. They were left alone deliberately: both are load-bearing on
 * tested paths, and consolidating them is a refactor worth doing on its own rather than
 * smuggling into a feature change.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { BOOKING_TIMEZONE } from '@/lib/business/utils/timezone';

export interface BusinessBookingEmailDetails {
  businessAccountId: string;
  bookingId: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  customerEmail: string | null;
  businessName: string;
  businessEmail: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  passengerCount: number;
  adults?: number;
  children?: number;
  infants?: number;
  totalPrice: number;
  walletDeducted: number;
  /** The tenant's wallet balance as it stands now, after this booking was charged. */
  newBalance: number;
  currency: string;
}

/** Location name and street address read better joined than as two rows. */
function withAddress(name: string | undefined, address: string | null): string {
  return name ? `${name}${address ? ` - ${address}` : ''}` : address || 'N/A';
}

export async function loadBusinessBookingEmailDetails(
  bookingId: string
): Promise<BusinessBookingEmailDetails | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('business_bookings')
    .select(
      `id, booking_number, trip_number, customer_name, customer_email,
       pickup_address, dropoff_address, pickup_datetime, business_account_id,
       passenger_count, adults, children, infants,
       total_price, wallet_deduction_amount,
       from_location:from_location_id(name),
       to_location:to_location_id(name),
       vehicle_type:vehicle_type_id(name)`
    )
    .eq('id', bookingId)
    .maybeSingle();

  const row = data as any;
  if (!row?.business_account_id) return null;

  const { data: account } = await admin
    .from('business_accounts')
    .select('business_name, business_email, wallet_balance, currency')
    .eq('id', row.business_account_id)
    .maybeSingle();

  return {
    businessAccountId: row.business_account_id,
    bookingId: row.id,
    bookingNumber: row.booking_number,
    tripNumber: row.trip_number || undefined,
    customerName: row.customer_name || 'Customer',
    customerEmail: row.customer_email || null,
    businessName: (account as any)?.business_name || 'Business',
    businessEmail: (account as any)?.business_email || null,
    pickupLocation: withAddress(row.from_location?.name, row.pickup_address),
    dropoffLocation: withAddress(row.to_location?.name, row.dropoff_address),
    pickupDateTime: new Date(row.pickup_datetime).toLocaleString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      dateStyle: 'full',
      timeStyle: 'short',
    }),
    vehicleType: row.vehicle_type?.name || 'Vehicle',
    passengerCount: row.passenger_count ?? 1,
    adults: row.adults ?? undefined,
    children: row.children ?? undefined,
    infants: row.infants ?? undefined,
    totalPrice: Number(row.total_price ?? 0),
    walletDeducted: Number(row.wallet_deduction_amount ?? row.total_price ?? 0),
    // Read after the charge, so it is the balance the owner will see in the portal rather
    // than a figure reconstructed by arithmetic.
    newBalance: Number((account as any)?.wallet_balance ?? 0),
    currency: (account as any)?.currency || 'AED',
  };
}
