'use server';

import { jsx } from 'react/jsx-runtime';
import { getResendClient, getEmailConfig } from '../config';
import {
  type EmailResult,
  type VendorApplicationReceivedEmailData,
  type VendorApplicationApprovedEmailData,
  type VendorApplicationRejectedEmailData,
  type BookingDatetimeModifiedEmailData,
} from '../types';
import VendorApplicationReceivedEmail from '../templates/vendor/application-received';
import VendorApplicationApprovedEmail from '../templates/vendor/application-approved';
import VendorApplicationRejectedEmail from '../templates/vendor/application-rejected';
import BookingDatetimeModifiedEmail from '../templates/vendor/booking-datetime-modified';

/**
 * Send vendor application received confirmation email
 */
export async function sendVendorApplicationReceivedEmail(
  data: VendorApplicationReceivedEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.email,
      replyTo: emailConfig.replyTo,
      subject: 'Vendor Application Received - Vehicle Service',
      react: jsx(VendorApplicationReceivedEmail, {
        name: data.name,
        applicationReference: data.applicationReference,
        submittedDate: data.submittedDate,
      }),
    });

    if (error) {
      console.error('Failed to send vendor application received email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send vendor application received email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending vendor application received email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send vendor application approved email
 */
export async function sendVendorApplicationApprovedEmail(
  data: VendorApplicationApprovedEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.email,
      replyTo: emailConfig.replyTo,
      subject: 'Congratulations! Your Vendor Application Approved',
      react: jsx(VendorApplicationApprovedEmail, {
        name: data.name,
        applicationReference: data.applicationReference,
        loginUrl: data.loginUrl,
        dashboardUrl: data.dashboardUrl,
      }),
    });

    if (error) {
      console.error('Failed to send vendor application approved email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send vendor application approved email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending vendor application approved email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send vendor application rejected email
 */
export async function sendVendorApplicationRejectedEmail(
  data: VendorApplicationRejectedEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.email,
      replyTo: emailConfig.replyTo,
      subject: 'Vendor Application Update - Vehicle Service',
      react: jsx(VendorApplicationRejectedEmail, {
        name: data.name,
        applicationReference: data.applicationReference,
        rejectionReason: data.rejectionReason,
        reapplyUrl: data.reapplyUrl,
      }),
    });

    if (error) {
      console.error('Failed to send vendor application rejected email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send vendor application rejected email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending vendor application rejected email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send booking datetime modified notification to vendor
 */
export async function sendBookingDatetimeModifiedEmail(
  data: BookingDatetimeModifiedEmailData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.vendorEmail,
      replyTo: emailConfig.replyTo,
      subject: `Booking Time Changed - #${data.bookingNumber}`,
      react: jsx(BookingDatetimeModifiedEmail, {
        vendorName: data.vendorName,
        bookingNumber: data.bookingNumber,
        customerName: data.customerName,
        pickupAddress: data.pickupAddress,
        previousDatetime: data.previousDatetime,
        newDatetime: data.newDatetime,
        modificationReason: data.modificationReason,
        bookingUrl: data.bookingUrl,
      }),
    });

    if (error) {
      console.error('Failed to send booking datetime modified email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send booking datetime modified email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending booking datetime modified email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}
