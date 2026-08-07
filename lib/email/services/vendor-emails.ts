import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type VendorApplicationReceivedEmailData,
  type VendorApplicationApprovedEmailData,
  type VendorApplicationRejectedEmailData,
  type BookingDatetimeModifiedEmailData,
  type BookingAssignmentEmailData,
  type BookingUnassignmentEmailData,
} from '../types';
import VendorApplicationReceivedEmail from '../templates/vendor/application-received';
import VendorApplicationApprovedEmail from '../templates/vendor/application-approved';
import VendorApplicationRejectedEmail from '../templates/vendor/application-rejected';
import BookingDatetimeModifiedEmail from '../templates/vendor/booking-datetime-modified';
import BookingAssignedEmail from '../templates/vendor/booking-assigned';
import BookingUnassignedEmail from '../templates/vendor/booking-unassigned';

/**
 * Vendor mail is platform-voice throughout, including for bookings that originated with
 * a white-label business. Vendors contract with the platform, not with the tenant, so
 * they must see one consistent sender across bookings from many tenants. Every send
 * here therefore passes businessAccountId: null deliberately.
 */

/**
 * Send vendor application received confirmation email
 */
export async function sendVendorApplicationReceivedEmail(
  data: VendorApplicationReceivedEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.email,
    subject: 'Vendor Application Received - Infinia Transfers',
    template: VendorApplicationReceivedEmail,
    templateProps: {
      name: data.name,
      applicationReference: data.applicationReference,
      submittedDate: data.submittedDate,
    },
  });
}

/**
 * Send vendor application approved email
 */
export async function sendVendorApplicationApprovedEmail(
  data: VendorApplicationApprovedEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.email,
    subject: 'Congratulations! Your Vendor Application Approved',
    template: VendorApplicationApprovedEmail,
    templateProps: {
      name: data.name,
      applicationReference: data.applicationReference,
      loginUrl: data.loginUrl,
      dashboardUrl: data.dashboardUrl,
    },
  });
}

/**
 * Send vendor application rejected email
 */
export async function sendVendorApplicationRejectedEmail(
  data: VendorApplicationRejectedEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.email,
    subject: 'Vendor Application Update - Infinia Transfers',
    template: VendorApplicationRejectedEmail,
    templateProps: {
      name: data.name,
      applicationReference: data.applicationReference,
      rejectionReason: data.rejectionReason,
      reapplyUrl: data.reapplyUrl,
    },
  });
}

/**
 * Send booking datetime modified notification to vendor
 */
export async function sendBookingDatetimeModifiedEmail(
  data: BookingDatetimeModifiedEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.vendorEmail,
    subject: `Booking Time Changed - #${data.tripNumber || data.bookingNumber}`,
    template: BookingDatetimeModifiedEmail,
    templateProps: {
      vendorName: data.vendorName,
      bookingNumber: data.bookingNumber,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupAddress: data.pickupAddress,
      previousDatetime: data.previousDatetime,
      newDatetime: data.newDatetime,
      modificationReason: data.modificationReason,
      bookingUrl: data.bookingUrl,
    },
  });
}

/**
 * Send booking assignment notification to vendor
 */
export async function sendBookingAssignmentEmail(
  data: BookingAssignmentEmailData & { bookingUrl: string }
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.vendorEmail,
    subject: `New Booking Assignment - #${data.tripNumber || data.bookingReference}`,
    template: BookingAssignedEmail,
    templateProps: {
      vendorName: data.vendorName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      vehicleCategory: data.vehicleCategory,
      vehicleType: data.vehicleType,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      bookingUrl: data.bookingUrl,
    },
  });
}

/**
 * Send booking unassignment notification to previous vendor
 */
export async function sendBookingUnassignmentEmail(
  data: BookingUnassignmentEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.vendorEmail,
    subject: `Booking Reassigned - #${data.tripNumber || data.bookingReference}`,
    template: BookingUnassignedEmail,
    templateProps: {
      vendorName: data.vendorName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupLocation: data.pickupLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      reassignmentReason: data.reassignmentReason,
      bookingUrl: data.bookingUrl,
    },
  });
}
