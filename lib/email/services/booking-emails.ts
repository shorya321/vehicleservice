'use server';

import { jsx } from 'react/jsx-runtime';
import { getResendClient, getEmailConfig } from '../config';
import {
  type EmailResult,
  type BookingConfirmationEmailData,
  type BookingStatusUpdateEmailData,
} from '../types';
import BookingConfirmationEmail from '../templates/booking/confirmation';
import BookingStatusUpdateEmail from '../templates/booking/status-update';

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(
  data: BookingConfirmationEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.customerEmail,
      replyTo: emailConfig.replyTo,
      subject: `Booking Confirmed - ${data.bookingReference}`,
      react: jsx(BookingConfirmationEmail, {
        customerName: data.customerName,
        bookingReference: data.bookingReference,
        vehicleCategory: data.vehicleCategory,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        dropoffDate: data.dropoffDate,
        dropoffTime: data.dropoffTime,
        totalAmount: data.totalAmount,
        currency: data.currency,
      }),
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send booking confirmation email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending booking confirmation email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send booking status update email to customer
 */
export async function sendBookingStatusUpdateEmail(
  data: BookingStatusUpdateEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.customerEmail,
      replyTo: emailConfig.replyTo,
      subject: `Booking Status Update - ${data.bookingReference}`,
      react: jsx(BookingStatusUpdateEmail, {
        customerName: data.customerName,
        bookingReference: data.bookingReference,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        statusMessage: data.statusMessage,
        vehicleCategory: data.vehicleCategory,
        pickupDate: data.pickupDate,
      }),
    });

    if (error) {
      console.error('Failed to send booking status update email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send booking status update email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending booking status update email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}
