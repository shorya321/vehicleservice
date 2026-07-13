'use server';

import { jsx } from 'react/jsx-runtime';
import { getResendClient, getEmailConfig } from '../config';
import {
  type EmailResult,
  type DriverBookingAssignmentEmailData,
  type DriverBookingUnassignmentEmailData,
} from '../types';
import DriverBookingAssignedEmail from '../templates/driver/booking-assigned';
import DriverBookingUnassignedEmail from '../templates/driver/booking-unassigned';

/**
 * Send trip assignment notification to driver
 */
export async function sendDriverBookingAssignmentEmail(
  data: DriverBookingAssignmentEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.driverEmail,
      replyTo: emailConfig.replyTo,
      subject: `Trip Assignment - #${data.tripNumber || data.bookingReference}`,
      react: jsx(DriverBookingAssignedEmail, {
        driverName: data.driverName,
        bookingReference: data.bookingReference,
        tripNumber: data.tripNumber,
        customerName: data.customerName,
        vehicleCategory: data.vehicleCategory,
        vehicleType: data.vehicleType,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        vendorName: data.vendorName,
      }),
    });

    if (error) {
      console.error('Failed to send driver booking assignment email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send driver booking assignment email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending driver booking assignment email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send trip removal notification to driver
 */
export async function sendDriverBookingUnassignmentEmail(
  data: DriverBookingUnassignmentEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.driverEmail,
      replyTo: emailConfig.replyTo,
      subject: `Trip Removed - #${data.tripNumber || data.bookingReference}`,
      react: jsx(DriverBookingUnassignedEmail, {
        driverName: data.driverName,
        bookingReference: data.bookingReference,
        tripNumber: data.tripNumber,
        customerName: data.customerName,
        pickupLocation: data.pickupLocation,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        reason: data.reason,
        vendorName: data.vendorName,
      }),
    });

    if (error) {
      console.error('Failed to send driver booking unassignment email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send driver booking unassignment email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending driver booking unassignment email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}
