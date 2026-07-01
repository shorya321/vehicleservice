'use server';

import { sendEmail } from '../utils/send-email';
import type {
  EmailResult,
  BusinessCustomerBookingConfirmationEmailData,
  BusinessCustomerDatetimeChangedEmailData,
  BusinessCustomerBookingCancelledEmailData,
  BusinessBookingStatusUpdateEmailData,
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
  subdomain: string;
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
      subdomain: data.subdomain,
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
  passengerCount: number;
  totalPrice: number;
  currency: string;
  walletDeducted: number;
  newBalance: number;
  bookingUrl: string;
  referenceNumber?: string;
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
      totalPrice: data.totalPrice,
      currency: data.currency,
      walletDeducted: data.walletDeducted,
      newBalance: data.newBalance,
      bookingUrl: data.bookingUrl,
      referenceNumber: data.referenceNumber,
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
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDateTime: data.pickupDateTime,
      vehicleType: data.vehicleType,
      passengerCount: data.passengerCount,
      referenceNumber: data.referenceNumber,
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
