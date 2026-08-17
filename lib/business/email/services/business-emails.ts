import { getAdminEmail, getAppUrl, sendBusinessEmail, sendPlatformEmail } from '../platform';
import type { EmailResult } from '../platform';
import type {
  BusinessCustomerBookingConfirmationEmailData,
  BusinessCustomerDatetimeChangedEmailData,
  BusinessCustomerBookingCancelledEmailData,
  BusinessBookingStatusUpdateEmailData,
  BusinessCustomerDriverAssignedEmailData,
  BusinessDriverAssignedEmailData,
  BusinessCustomerBookingCompletedEmailData,
  BusinessVendorAssignmentEmailData,
} from '../types';
import BusinessAccountApprovedEmail from '../templates/account-approved';
import BusinessAccountRejectedEmail from '../templates/account-rejected';
import BusinessWelcomePendingEmail from '../templates/welcome-pending';
import BusinessBookingConfirmationEmail from '../templates/booking-confirmation';
import BusinessBookingCancelledEmail from '../templates/booking-cancelled';
import CustomerBookingConfirmationEmail from '../templates/customer-booking-confirmation';
import CustomerDatetimeChangedEmail from '../templates/customer-datetime-changed';
import CustomerBookingCancelledEmail from '../templates/customer-booking-cancelled';
import BusinessBookingStatusUpdateEmail from '../templates/booking-status-update';
import BusinessCustomerBookingStatusUpdateEmail from '../templates/customer-booking-status-update';
import BusinessCustomerBookingCompletedEmail from '../templates/customer-booking-completed';
import BusinessVendorAssignedEmail from '../templates/booking-vendor-assigned';
import BusinessVendorRejectedEmail from '../templates/booking-vendor-rejected';
import CustomerDriverAssignedEmail from '../templates/customer-driver-assigned';
import BusinessBookingDriverAssignedEmail from '../templates/booking-driver-assigned';
import NewBusinessRegistrationAdminNotificationEmail from '../templates/new-registration-admin-notification';

/**
 * Business Registration Admin Notification Email Data
 */
export interface BusinessRegistrationAdminNotificationEmailData {
  businessId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  contactPersonName: string;
  registrationDate: string;
}

/**
 * Business Account Approval Email Data
 */
export interface BusinessApprovalEmailData {
  email: string;
  businessName: string;
  ownerName: string;
  loginUrl: string;
}

/**
 * Business Account Rejection Email Data
 */
export interface BusinessRejectionEmailData {
  email: string;
  businessName: string;
  ownerName: string;
  reason?: string;
  supportEmail?: string;
}

/**
 * Business Welcome (Pending Approval) Email Data
 */
export interface BusinessWelcomePendingEmailData {
  email: string;
  businessName: string;
  ownerName: string;
  supportEmail?: string;
}

/**
 * Send email when business account is approved
 */
export async function sendBusinessApprovalEmail(
  data: BusinessApprovalEmailData
): Promise<EmailResult> {
  return sendPlatformEmail({
    // Platform: the platform is speaking about the tenant's account, and it carries the
    // platform login URL.
    to: data.email,
    subject: 'Your Business Account Has Been Approved!',
    template: BusinessAccountApprovedEmail,
    templateProps: {
      businessName: data.businessName,
      ownerName: data.ownerName,
      loginUrl: data.loginUrl,
    },
  });
}

/**
 * Send email when business account is rejected
 */
export async function sendBusinessRejectionEmail(
  data: BusinessRejectionEmailData
): Promise<EmailResult> {
  return sendPlatformEmail({
    // Platform: delivering a rejection through the rejected party's own mail server would
    // be both absurd and unreliable.
    to: data.email,
    subject: 'Business Account Application Update',
    template: BusinessAccountRejectedEmail,
    templateProps: {
      businessName: data.businessName,
      ownerName: data.ownerName,
      reason: data.reason,
      supportEmail: data.supportEmail,
    },
  });
}

/**
 * Send welcome email when business account is registered (pending approval)
 */
export async function sendBusinessWelcomePendingEmail(
  data: BusinessWelcomePendingEmailData
): Promise<EmailResult> {
  return sendPlatformEmail({
    // Platform: the account is still pending, so nothing about it is verified. Letting an
    // unapproved signup nominate an SMTP server we then send from would hand anyone with a
    // signup form an authenticated relay.
    to: data.email,
    subject: 'Welcome to Infinia Transfers - Registration Received',
    template: BusinessWelcomePendingEmail,
    templateProps: {
      businessName: data.businessName,
      ownerName: data.ownerName,
      supportEmail: data.supportEmail,
    },
  });
}

/**
 * Business Booking Confirmation Email Data
 */
export interface BusinessBookingConfirmationEmailData {
  /** The tenant this booking belongs to, so the email sends on their SMTP and brand. */
  businessAccountId: string;
  email: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  customerPhone?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  /** Every guest (adults + children + infants). */
  passengerCount: number;
  adults?: number;
  children?: number;
  infants?: number;
  totalPrice: number;
  currency: string;
  walletDeducted: number;
  newBalance: number;
  bookingUrl: string;
  referenceNumber?: string;
  extras?: Array<{ label: string; quantity: number; price: number; childAges?: number[] }>;
  /** The AED amount actually charged, when `currency` is a converted display currency. */
  originalAmount?: number;
  originalCurrency?: string;
}

/**
 * Send booking confirmation email to business
 */
export async function sendBusinessBookingConfirmationEmail(
  data: BusinessBookingConfirmationEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    // Addressed to the business owner, not to their customer, so it goes out on platform
    // credentials wearing the tenant's brand. Routing owner alerts over the tenant's own
    // server means a business whose SMTP has broken stops being told anything, with the
    // broken server as the only thing that could report it.
    forcePlatformTransport: true,
    kind: 'business.booking.confirmation',
    to: data.email,
    subject: `Booking Confirmed - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessBookingConfirmationEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      vehicleType: data.vehicleType,
      passengerCount: data.passengerCount,
      adults: data.adults,
      children: data.children,
      infants: data.infants,
      totalPrice: data.totalPrice,
      currency: data.currency,
      walletDeducted: data.walletDeducted,
      newBalance: data.newBalance,
      bookingUrl: data.bookingUrl,
      referenceNumber: data.referenceNumber,
      extras: data.extras,
      originalAmount: data.originalAmount,
      originalCurrency: data.originalCurrency,
    },
  });
}

/**
 * Business Booking Cancellation Email Data
 */
export interface BusinessBookingCancellationEmailData {
  /** The tenant this booking belongs to, so the email sends on their SMTP and brand. */
  businessAccountId: string;
  email: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
  refundAmount: number;
  newBalance: number;
  currency: string;
  walletUrl: string;
  /** The AED amount actually refunded, when `currency` is a converted display currency. */
  originalAmount?: number;
  originalCurrency?: string;
}

/**
 * Send booking cancellation email to business
 */
export async function sendBusinessBookingCancellationEmail(
  data: BusinessBookingCancellationEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    // Addressed to the business owner, not to their customer, so it goes out on platform
    // credentials wearing the tenant's brand. Routing owner alerts over the tenant's own
    // server means a business whose SMTP has broken stops being told anything, with the
    // broken server as the only thing that could report it.
    forcePlatformTransport: true,
    kind: 'business.booking.cancellation',
    to: data.email,
    subject: `Booking Cancelled - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessBookingCancelledEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      cancellationReason: data.cancellationReason,
      refundAmount: data.refundAmount,
      newBalance: data.newBalance,
      currency: data.currency,
      walletUrl: data.walletUrl,
      originalAmount: data.originalAmount,
      originalCurrency: data.originalCurrency,
    },
  });
}

/**
 * Send booking confirmation email to customer when business books on their behalf
 */
export async function sendBusinessCustomerBookingConfirmationEmail(
  data: BusinessCustomerBookingConfirmationEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    kind: 'business.customer.booking_confirmation',
    to: data.customerEmail,
    subject: `Your Transfer Booking - #${data.tripNumber || data.bookingNumber}`,
    template: CustomerBookingConfirmationEmail,
    templateProps: {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      vehicleType: data.vehicleType,
      passengerCount: data.passengerCount,
      adults: data.adults,
      children: data.children,
      infants: data.infants,
      referenceNumber: data.referenceNumber,
      extras: data.extras,
    },
  });
}

/**
 * Send datetime change notification to customer
 */
export async function sendBusinessCustomerDatetimeChangedEmail(
  data: BusinessCustomerDatetimeChangedEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    kind: 'business.customer.datetime_changed',
    to: data.customerEmail,
    subject: `Pickup Time Changed - #${data.tripNumber || data.bookingNumber}`,
    template: CustomerDatetimeChangedEmail,
    templateProps: {
      customerName: data.customerName,
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      previousDateTime: data.previousDateTime,
      newDateTime: data.newDateTime,
      modificationReason: data.modificationReason,
    },
  });
}

/**
 * Send booking cancellation notification to customer
 */
export async function sendBusinessCustomerBookingCancelledEmail(
  data: BusinessCustomerBookingCancelledEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    kind: 'business.customer.booking_cancelled',
    to: data.customerEmail,
    subject: `Booking Cancelled - #${data.tripNumber || data.bookingNumber}`,
    template: CustomerBookingCancelledEmail,
    templateProps: {
      customerName: data.customerName,
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      cancellationReason: data.cancellationReason,
    },
  });
}

/**
 * Send driver contact details to the passenger of a business booking
 */
export async function sendBusinessCustomerDriverAssignedEmail(
  data: BusinessCustomerDriverAssignedEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    kind: 'business.customer.driver_assigned',
    to: data.customerEmail,
    subject: `Your Driver Has Been Assigned - #${data.tripNumber || data.bookingReference}`,
    template: CustomerDriverAssignedEmail,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
    },
  });
}

/**
 * Send driver contact details to the business account that made the booking
 */
export async function sendBusinessDriverAssignedEmail(
  data: BusinessDriverAssignedEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    // Addressed to the business owner, not to their customer, so it goes out on platform
    // credentials wearing the tenant's brand. Routing owner alerts over the tenant's own
    // server means a business whose SMTP has broken stops being told anything, with the
    // broken server as the only thing that could report it.
    forcePlatformTransport: true,
    kind: 'business.driver_assigned',
    to: data.businessEmail,
    subject: `Driver Assigned - #${data.tripNumber || data.bookingReference}`,
    template: BusinessBookingDriverAssignedEmail,
    templateProps: {
      businessName: data.businessName,
      passengerName: data.passengerName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      bookingUrl: `${getAppUrl()}/business/bookings/${data.bookingId}`,
    },
  });
}

/**
 * Send booking status update email to business owner
 */
export async function sendBusinessBookingStatusUpdateEmail(
  data: BusinessBookingStatusUpdateEmailData
): Promise<EmailResult> {
  const statusLabel = data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1);
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    // Addressed to the business owner, not to their customer, so it goes out on platform
    // credentials wearing the tenant's brand. Routing owner alerts over the tenant's own
    // server means a business whose SMTP has broken stops being told anything, with the
    // broken server as the only thing that could report it.
    forcePlatformTransport: true,
    kind: 'business.booking.status_update',
    to: data.email,
    subject: `Booking ${statusLabel} - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessBookingStatusUpdateEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      statusMessage: data.statusMessage,
    },
  });
}

/**
 * The passenger's copy of a status change.
 *
 * Separate from the owner's because the two audiences need different words: the owner
 * template opens "Hi {businessName}", which read as "Hi Acme Hotel," to the passenger
 * when one template served both.
 *
 * Tenant transport, because the passenger's counterpart is the business.
 */
export async function sendBusinessCustomerBookingStatusUpdateEmail(
  data: BusinessBookingStatusUpdateEmailData
): Promise<EmailResult> {
  const statusLabel = data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1);

  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    kind: 'business.customer.booking_status_update',
    to: data.email,
    subject: `Your booking is ${statusLabel} - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessCustomerBookingStatusUpdateEmail,
    templateProps: {
      customerName: data.customerName,
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      statusMessage: data.statusMessage,
    },
  });
}

/**
 * Tells the passenger their trip is done.
 *
 * Tenant transport: the passenger's counterpart is the business. Nothing was sent on
 * completion before this, so the confirmation from before the trip was the last thing a
 * passenger ever heard about it.
 */
export async function sendBusinessCustomerBookingCompletedEmail(
  data: BusinessCustomerBookingCompletedEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    kind: 'business.customer.booking_completed',
    to: data.customerEmail,
    subject: `Your trip is complete - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessCustomerBookingCompletedEmail,
    templateProps: {
      customerName: data.customerName,
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
    },
  });
}

/**
 * Tells the business a transport partner is now behind one of its bookings.
 *
 * Owner-only, platform transport. Assigning a vendor previously notified the vendor and
 * the driver and left the business, whose booking it is, hearing nothing.
 */
export async function sendBusinessVendorAssignedEmail(
  data: BusinessVendorAssignmentEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    forcePlatformTransport: true,
    kind: 'business.booking.vendor_assigned',
    to: data.email,
    subject: `Transport arranged - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessVendorAssignedEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      bookingUrl: `${getAppUrl()}/business/bookings/${data.bookingId}`,
    },
  });
}

/**
 * Tells the business a booking lost its transport partner and is being reassigned.
 *
 * Owner-only, platform transport. The passenger is deliberately not told: nothing has
 * changed for them, and a rejection they cannot act on is only a worry.
 */
export async function sendBusinessVendorRejectedEmail(
  data: BusinessVendorAssignmentEmailData
): Promise<EmailResult> {
  return sendBusinessEmail({
    businessAccountId: data.businessAccountId,
    forcePlatformTransport: true,
    kind: 'business.booking.vendor_rejected',
    to: data.email,
    subject: `Arranging new transport - #${data.tripNumber || data.bookingNumber}`,
    template: BusinessVendorRejectedEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupLocation: data.pickupLocation,
      pickupDateTime: data.pickupDateTime,
      bookingUrl: `${getAppUrl()}/business/bookings/${data.bookingId}`,
    },
  });
}

/**
 * Send admin notification when a new business registers (pending approval)
 */
export async function sendBusinessRegistrationAdminNotificationEmail(
  data: BusinessRegistrationAdminNotificationEmailData
): Promise<EmailResult> {
  const adminEmail = getAdminEmail();
  const appUrl = getAppUrl();
  return sendPlatformEmail({
    // Platform: the recipient is a platform administrator, not the tenant's audience.
    to: adminEmail,
    subject: `New Business Registration - ${data.businessName}`,
    template: NewBusinessRegistrationAdminNotificationEmail,
    templateProps: {
      businessName: data.businessName,
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone,
      contactPersonName: data.contactPersonName,
      registrationDate: data.registrationDate,
      businessDetailsUrl: `${appUrl}/admin/businesses/${data.businessId}`,
    },
  });
}
