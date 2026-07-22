'use server';

import { sendEmail } from '../utils/send-email';
import {
  type DirectBookingCustomerCancelledEmailData,
  type DirectBookingCustomerConfirmationEmailData,
  type DirectBookingCustomerStatusUpdateEmailData,
  type DirectBookingDriverAssignmentEmailData,
  type EmailResult,
} from '../types';
import DirectBookingCustomerConfirmationEmail from '../templates/direct-booking/customer-confirmation';
import DirectBookingCustomerStatusUpdateEmail from '../templates/direct-booking/customer-status-update';
import DirectBookingCustomerCancelledEmail from '../templates/direct-booking/customer-cancelled';
import DirectBookingDriverAssignmentEmail from '../templates/direct-booking/driver-assignment';

/**
 * Emails for vendor direct bookings (offline / phone reservations).
 *
 * These go out in the vendor's voice, so each accepts an optional `replyTo` the
 * caller sets to the vendor's own address when one is on file.
 *
 * Every function returns an `EmailResult` and never throws — `sendEmail` swallows
 * both Resend errors and configuration errors. Callers still dispatch these
 * un-awaited so a slow send cannot delay a booking write.
 */

/**
 * Send the customer confirmation for a newly recorded offline booking
 */
export async function sendDirectBookingCustomerConfirmationEmail(
  data: DirectBookingCustomerConfirmationEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.customerEmail,
    subject: `Booking Confirmed - ${data.bookingReference}`,
    template: DirectBookingCustomerConfirmationEmail,
    replyTo: data.replyTo,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      statusLabel: data.statusLabel,
      vehicleLabel: data.vehicleLabel,
      vehicleRegistration: data.vehicleRegistration,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      returnDate: data.returnDate,
      returnTime: data.returnTime,
      totalAmount: data.totalAmount,
      amountPaid: data.amountPaid,
      balanceDue: data.balanceDue,
      currency: data.currency,
      paymentStatusLabel: data.paymentStatusLabel,
      paymentMethodLabel: data.paymentMethodLabel,
      customerNotes: data.customerNotes,
      vendorName: data.vendorName,
      vendorPhone: data.vendorPhone,
    },
  });
}

/**
 * Send the customer a status change on an offline booking
 */
export async function sendDirectBookingCustomerStatusUpdateEmail(
  data: DirectBookingCustomerStatusUpdateEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.customerEmail,
    subject: `Booking Update - ${data.bookingReference}`,
    template: DirectBookingCustomerStatusUpdateEmail,
    replyTo: data.replyTo,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      previousStatusLabel: data.previousStatusLabel,
      newStatusLabel: data.newStatusLabel,
      vehicleLabel: data.vehicleLabel,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      vendorName: data.vendorName,
      vendorPhone: data.vendorPhone,
    },
  });
}

/**
 * Tell the customer their offline booking was cancelled
 */
export async function sendDirectBookingCustomerCancelledEmail(
  data: DirectBookingCustomerCancelledEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.customerEmail,
    subject: `Booking Cancelled - ${data.bookingReference}`,
    template: DirectBookingCustomerCancelledEmail,
    replyTo: data.replyTo,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      vehicleLabel: data.vehicleLabel,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      vendorName: data.vendorName,
      vendorPhone: data.vendorPhone,
    },
  });
}

/**
 * Tell a driver they have been assigned to an offline booking
 */
export async function sendDirectBookingDriverAssignmentEmail(
  data: DirectBookingDriverAssignmentEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.driverEmail,
    subject: `Trip Assignment - #${data.bookingReference}`,
    template: DirectBookingDriverAssignmentEmail,
    replyTo: data.replyTo,
    templateProps: {
      driverName: data.driverName,
      bookingReference: data.bookingReference,
      customerName: data.customerName,
      vehicleLabel: data.vehicleLabel,
      vehicleRegistration: data.vehicleRegistration,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      returnDate: data.returnDate,
      returnTime: data.returnTime,
      vendorName: data.vendorName,
      vendorPhone: data.vendorPhone,
    },
  });
}
