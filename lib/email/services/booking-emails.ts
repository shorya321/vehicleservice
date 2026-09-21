import { getAppUrl } from '../config';
import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type BookingConfirmationEmailData,
  type BookingStatusUpdateEmailData,
  type BookingCancelledEmailData,
  type CustomerDriverAssignedEmailData,
} from '../types';
import BookingConfirmationEmail from '../templates/booking/confirmation';
import BookingStatusUpdateEmail from '../templates/booking/status-update';
import BookingDriverAssignedEmail from '../templates/booking/driver-assigned';
import BookingCancelledEmail from '../templates/booking/cancelled';
import type { ComponentProps } from 'react';

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(
  data: BookingConfirmationEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.customerEmail,
    subject: `Booking Confirmed - ${data.tripNumber || data.bookingReference}`,
    template: BookingConfirmationEmail,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      vehicleCategory: data.vehicleCategory,
      vehicleType: data.vehicleType,
      passengerCapacity: data.passengerCapacity,
      luggageCapacity: data.luggageCapacity,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      totalAmount: data.totalAmount,
      currency: data.currency,
      originalAmount: data.originalAmount,
      originalCurrency: data.originalCurrency,
      passengerCount: data.passengerCount,
      adults: data.adults,
      children: data.children,
      infants: data.infants,
      basePrice: data.basePrice,
      amenitiesPrice: data.amenitiesPrice,
      extras: data.extras,
      trip: data.trip,
      customerNotes: data.customerNotes,
      invoiceUrl: data.invoiceUrl,
    },
  });
}

/**
 * Send booking status update email to customer
 */
export async function sendBookingStatusUpdateEmail(
  data: BookingStatusUpdateEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.customerEmail,
    subject: `Booking Status Update - ${data.tripNumber || data.bookingReference}`,
    template: BookingStatusUpdateEmail,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      statusMessage: data.statusMessage,
      vehicleCategory: data.vehicleCategory,
      pickupDate: data.pickupDate,
    },
  });
}

/**
 * Send driver contact details to the customer once a vendor assigns a driver
 */
export async function sendBookingDriverAssignedEmail(
  data: CustomerDriverAssignedEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.customerEmail,
    subject: `Your Driver Has Been Assigned - #${data.tripNumber || data.bookingReference}`,
    template: BookingDriverAssignedEmail,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      accountUrl: `${getAppUrl()}/account`,
    },
  });
}

/**
 * Send the cancellation notice to the customer: a booking, or one journey of a trip.
 */
export async function sendBookingCancelledEmail(data: BookingCancelledEmailData): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.customerEmail,
    subject: `Booking Cancelled - ${data.tripNumber || data.bookingReference}`,
    template: BookingCancelledEmail,
    templateProps: {
      customerName: data.customerName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      refundDue: data.refundDue,
      tripLabel: data.tripLabel,
      groupNumber: data.groupNumber,
      discountForfeited: data.discountForfeited,
    } satisfies ComponentProps<typeof BookingCancelledEmail>,
  });
}
