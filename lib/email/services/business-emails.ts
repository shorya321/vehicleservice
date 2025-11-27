'use server';

import { sendEmail } from '../utils/send-email';
import type { EmailResult } from '../types';
import BusinessAccountApprovedEmail from '../templates/business/account-approved';
import BusinessAccountRejectedEmail from '../templates/business/account-rejected';
import BusinessWelcomePendingEmail from '../templates/business/welcome-pending';
import BusinessBookingConfirmationEmail from '../templates/business/booking-confirmation';
import BusinessBookingCancelledEmail from '../templates/business/booking-cancelled';

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
    subject: 'Welcome to Vehicle Service - Registration Received',
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
    subject: `Booking Confirmed - #${data.bookingNumber}`,
    template: BusinessBookingConfirmationEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
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
    subject: `Booking Cancelled - #${data.bookingNumber}`,
    template: BusinessBookingCancelledEmail,
    templateProps: {
      businessName: data.businessName,
      bookingNumber: data.bookingNumber,
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
