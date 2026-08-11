import type React from 'react';
import type { MailProvider } from './transport/types';

// Email sending result
export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
  /** Which credentials the message actually went out on. Absent if it never reached a transport. */
  provider?: MailProvider;
}

/**
 * Arguments to the single sender in lib/email/utils/send-email.ts.
 *
 * Declared here rather than in send-email.ts because that module used to carry a
 * 'use server' directive, and exporting a type from a Server Action module breaks the
 * app at runtime while tsc stays silent. The directive is gone, but keeping the type
 * out of there means the hazard cannot come back by accident.
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  template: React.ComponentType<any>;
  templateProps: Record<string, any>;
  /**
   * Overrides the reply-to for mail sent on someone else's behalf,
   * a vendor's own address on a direct-booking notification, for example.
   * Omit to keep the sender's default.
   */
  replyTo?: string;
  /**
   * The tenant whose SMTP credentials and brand this goes out on.
   * `null` is a legal, meaningful value: platform mail, on purpose.
   *
   * Required rather than optional so `tsc --noEmit` enumerates every call site. The
   * failure mode of an optional field is silent - forget it and the mail quietly goes
   * out platform-branded, which is precisely the bug this feature exists to prevent.
   */
  businessAccountId: string | null;
  /**
   * Send on platform credentials while keeping the tenant's brand.
   *
   * For mail addressed to the business owner rather than to their customer. A tenant
   * whose mail server has failed must still receive the notification telling them so,
   * and that cannot travel over the server that failed.
   *
   * Meaningless without a `businessAccountId`, which is what supplies the brand.
   */
  forcePlatformTransport?: boolean;
  /**
   * Stable key for the delivery log, e.g. 'business.booking.confirmation'.
   * Free-form: adding a template must never require a migration.
   */
  kind?: string;
  /** Booking, quotation or transaction id, so a log row can be traced back. */
  relatedId?: string;
}

// Authentication emails
export interface WelcomeEmailData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface VerificationEmailData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetUrl: string;
}

// Booking emails
export interface BookingConfirmationEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  vehicleCategory: string;
  vehicleType?: string;
  passengerCapacity?: number;
  luggageCapacity?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  currency: string;
  bookingReference: string;
  tripNumber?: string;
  originalAmount?: number;
  originalCurrency?: string;
  /** Total guests (adults + children + infants). */
  passengerCount?: number;
  adults?: number;
  children?: number;
  infants?: number;
  basePrice?: number;
  amenitiesPrice?: number;
  /**
   * `childAges` carries one age per seat for child-seat add-ons (see booking_amenities.child_ages).
   * Optional so every existing producer and consumer of `extras` still type-checks.
   */
  extras?: Array<{ label: string; quantity: number; price: number; childAges?: number[] }>;
  customerNotes?: string;
  invoiceUrl?: string;
}

export interface BookingStatusUpdateEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  tripNumber?: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
  vehicleCategory: string;
  pickupDate: string;
}

export interface BookingAssignmentEmailData {
  bookingId: string;
  vendorName: string;
  vendorEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
}

export interface BookingUnassignmentEmailData {
  vendorName: string;
  vendorEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  reassignmentReason?: string;
  bookingUrl: string;
}

// Vendor application emails
export interface VendorApplicationReceivedEmailData {
  email: string;
  name: string;
  applicationReference: string;
  submittedDate: string;
}

export interface VendorApplicationApprovedEmailData {
  email: string;
  name: string;
  applicationReference: string;
  loginUrl: string;
  dashboardUrl: string;
}

export interface VendorApplicationRejectedEmailData {
  email: string;
  name: string;
  applicationReference: string;
  rejectionReason: string;
  reapplyUrl?: string;
}

// Admin notification emails
export interface NewBookingNotificationEmailData {
  adminEmail: string;
  bookingId: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  customerEmail: string;
  vehicleCategory: string;
  vehicleType?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  currency: string;
  bookingDetailsUrl: string;
}

export interface NewVendorApplicationNotificationEmailData {
  adminEmail: string;
  applicationId: string;
  applicationReference: string;
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  submittedDate: string;
  applicationDetailsUrl: string;
}

export interface NewUserRegistrationNotificationEmailData {
  adminEmail: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  registrationDate: string;
  userDetailsUrl: string;
}

// Booking datetime modification notification
export interface BookingDatetimeModifiedEmailData {
  vendorEmail: string;
  vendorName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupAddress: string;
  previousDatetime: string;
  newDatetime: string;
  modificationReason?: string;
  bookingUrl: string;
}

// Driver notification emails
export interface DriverBookingAssignmentEmailData {
  driverName: string;
  driverEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  vendorName: string;
}

export interface DriverBookingUnassignmentEmailData {
  driverName: string;
  driverEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  reason?: string;
  vendorName: string;
}

/**
 * Business email data shapes used to live here. They moved to
 * lib/business/email/types.ts when the business module took ownership of its own email
 * presentation, and nothing outside that module referenced them.
 */

/**
 * Driver contact details shared by every driver-assigned notification.
 * Dates are pre-formatted in the booking timezone by the caller.
 */
export interface DriverAssignedTripDetails {
  bookingReference: string;
  tripNumber?: string;
  driverName: string;
  driverPhone: string | null;
  pickupDate: string;
  pickupTime: string;
}

/** Driver-assigned email for a retail customer. */
export interface CustomerDriverAssignedEmailData extends DriverAssignedTripDetails {
  customerName: string;
  customerEmail: string;
}

// ---------------------------------------------------------------------------
// Vendor direct bookings (offline / phone reservations)
//
// These are sent on the vendor's behalf, not the platform's, so each carries
// vendor identity for the sign-off and reply-to.
//
// None of them declares `internalNotes` or `cancellationReason`: the booking
// form promises the vendor "Only your team sees this", so a customer-facing
// template must not be able to receive them. Leaving the fields off the type
// makes passing one a compile error rather than a matter of care.
// ---------------------------------------------------------------------------

/** Vendor identity shared by every direct-booking notification. */
export interface DirectBookingVendorIdentity {
  vendorName: string;
  vendorPhone?: string;
}

/** Trip facts shared by the customer-facing direct-booking emails. */
export interface DirectBookingTripDetails extends DirectBookingVendorIdentity {
  bookingReference: string;
  customerName: string;
  vehicleLabel: string;
  vehicleRegistration: string;
  driverName: string;
  driverPhone?: string;
  pickupLocation: string;
  dropoffLocation?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

/** Sent to the customer when a vendor records a new offline booking. */
export interface DirectBookingCustomerConfirmationEmailData extends DirectBookingTripDetails {
  customerEmail: string;
  statusLabel: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  paymentStatusLabel: string;
  paymentMethodLabel?: string;
  /** The customer's own request. Never the vendor's internal notes. */
  customerNotes?: string;
  /** Vendor's reply-to, when they have one on file. */
  replyTo?: string;
}

/** Sent to the customer when the booking moves between statuses. */
export interface DirectBookingCustomerStatusUpdateEmailData extends DirectBookingVendorIdentity {
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  previousStatusLabel: string;
  newStatusLabel: string;
  vehicleLabel: string;
  pickupDate: string;
  pickupTime: string;
  replyTo?: string;
}

/**
 * Sent to the customer when the booking is cancelled.
 *
 * Carries no reason: `cancellation_reason` is the vendor's own record, written
 * in the third person about the customer ("Customer cancelled", "no-show"), and
 * echoing it back would disclose an internal judgement.
 */
export interface DirectBookingCustomerCancelledEmailData extends DirectBookingVendorIdentity {
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  vehicleLabel: string;
  pickupDate: string;
  pickupTime: string;
  replyTo?: string;
}

/**
 * Sent to the driver when they are assigned to an offline booking.
 *
 * Carries no customer phone number on purpose: the driver is not given the
 * passenger's contact details, and the vendor stays the intermediary. The
 * template directs the driver to the vendor for anything they need.
 */
export interface DirectBookingDriverAssignmentEmailData extends DirectBookingVendorIdentity {
  driverName: string;
  driverEmail: string;
  bookingReference: string;
  customerName: string;
  vehicleLabel: string;
  vehicleRegistration: string;
  pickupLocation: string;
  dropoffLocation?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  replyTo?: string;
}
