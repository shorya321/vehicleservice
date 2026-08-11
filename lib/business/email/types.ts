/**
 * Data shapes for business emails.
 *
 * Moved out of lib/email/types.ts when the business module took ownership of its own
 * email presentation. Nothing outside lib/business/email/ referenced them, so they
 * belong here.
 */

import type { DriverAssignedTripDetails } from './brand';

export type { DriverAssignedTripDetails };

/**
 * Every business-module email carries the tenant it belongs to, so the sender can pick
 * that tenant's SMTP credentials and brand.
 *
 * Required, not optional. An optional field fails silently: forget it and the mail goes
 * out under the platform's name to a customer who has never heard of the platform.
 */
export interface BusinessScopedEmailData {
  businessAccountId: string;
}

// Passenger-facing: sent from the business to the customer it booked for.

export interface BusinessCustomerBookingConfirmationEmailData extends BusinessScopedEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  /** Every guest (adults + children + infants). */
  passengerCount: number;
  adults?: number;
  children?: number;
  infants?: number;
  referenceNumber?: string;
  /**
   * Kept structurally separate from the customer-flow `extras` on purpose. The business
   * module is independent, and the end-customer variant deliberately hides prices.
   * `childAges` carries one age per seat for child-seat add-ons.
   */
  extras?: Array<{ label: string; quantity: number; price: number; childAges?: number[] }>;
}

export interface BusinessCustomerDatetimeChangedEmailData extends BusinessScopedEmailData {
  customerName: string;
  customerEmail: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  previousDateTime: string;
  newDateTime: string;
  modificationReason?: string;
}

export interface BusinessCustomerBookingCancelledEmailData extends BusinessScopedEmailData {
  customerName: string;
  customerEmail: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
}

/** Driver-assigned email for the passenger of a business booking. */
export interface BusinessCustomerDriverAssignedEmailData
  extends DriverAssignedTripDetails,
    BusinessScopedEmailData {
  customerName: string;
  customerEmail: string;
}

// Owner-facing: sent to the business about its own bookings.

export interface BusinessBookingStatusUpdateEmailData extends BusinessScopedEmailData {
  email: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
}

/** Driver-assigned email for the business account that made the booking. */
export interface BusinessDriverAssignedEmailData
  extends DriverAssignedTripDetails,
    BusinessScopedEmailData {
  businessName: string;
  businessEmail: string;
  passengerName: string;
  bookingId: string;
}

/** The passenger's trip-complete note. */
export interface BusinessCustomerBookingCompletedEmailData extends BusinessScopedEmailData {
  customerName: string;
  customerEmail: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
}

/**
 * Supply-chain notices to the business owner.
 *
 * Shared shape for "a partner was assigned" and "a partner dropped out", because the
 * owner needs the same booking facts in both cases. Neither carries the partner's
 * identity: see the templates for why.
 */
export interface BusinessVendorAssignmentEmailData extends BusinessScopedEmailData {
  email: string;
  businessName: string;
  bookingId: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
}
