'use server';

import { sendEmail } from '../utils/send-email';
import type {
  EmailResult,
  BusinessCustomerBookingConfirmationEmailData,
  BusinessCustomerDatetimeChangedEmailData,
  BusinessCustomerBookingCancelledEmailData,
  BusinessBookingStatusUpdateEmailData,
  BusinessCustomerDriverAssignedEmailData,
  BusinessDriverAssignedEmailData,
} from '../types';
import BusinessAccountApprovedEmail from '../templates/business/account-approved';
import BusinessAccountRejectedEmail from '../templates/business/account-rejected';
import BusinessWelcomePendingEmail from '../templates/business/welcome-pending';
import BusinessBookingConfirmationEmail from '../templates/business/booking-confirmation';
import BusinessBookingCancelledEmail from '../templates/business/booking-cancelled';
import CustomerBookingConfirmationEmail from '../templates/business/customer-booking-confirmation';
import CustomerDatetimeChangedEmail from '../templates/business/customer-datetime-changed';
import CustomerBookingCancelledEmail from '../templates/business/customer-booking-cancelled';
import BusinessBookingStatusUpdateEmail from '../templates/business/booking-status-update';
import CustomerDriverAssignedEmail from '../templates/business/customer-driver-assigned';
import BusinessBookingDriverAssignedEmail from '../templates/business/booking-driver-assigned';
import NewBusinessRegistrationAdminNotificationEmail from '../templates/business/new-registration-admin-notification';
import { getAdminEmail, getAppUrl } from '../config';

/**
 * Business Registration Admin Notification Email Data
 */
export interface BusinessRegistrationAdminNotificationEmailData {
  businessId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  contactPersonName: string;
  subdomain: string;
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  extras?: Array<{ label: string; quantity: number; price: number }>;
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
 * Send admin notification when a new business registers (pending approval)
 */
export async function sendBusinessRegistrationAdminNotificationEmail(
  data: BusinessRegistrationAdminNotificationEmailData
): Promise<EmailResult> {
  const adminEmail = getAdminEmail();
  const appUrl = getAppUrl();
  return sendEmail({
    to: adminEmail,
    subject: `New Business Registration - ${data.businessName}`,
    template: NewBusinessRegistrationAdminNotificationEmail,
    templateProps: {
      businessName: data.businessName,
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone,
      contactPersonName: data.contactPersonName,
      subdomain: data.subdomain,
      registrationDate: data.registrationDate,
      businessDetailsUrl: `${appUrl}/admin/businesses/${data.businessId}`,
    },
  });
}
