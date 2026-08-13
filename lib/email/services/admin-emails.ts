/**
 * Platform operations mail: the recipient is always a platform administrator.
 *
 * Every send here passes businessAccountId: null. Routing platform ops alerts through a
 * tenant's mail server would leak platform data to a third party, and would let a
 * business suppress alerts about itself by pointing its SMTP at a black hole.
 */

import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type NewUserRegistrationNotificationEmailData,
  type NewBookingNotificationEmailData,
  type NewVendorApplicationNotificationEmailData,
} from '../types';
import NewUserNotificationEmail from '../templates/admin/new-user-notification';
import NewBookingNotificationEmail from '../templates/admin/new-booking-notification';
import NewVendorApplicationNotificationEmail from '../templates/admin/new-vendor-application-notification';

/**
 * Send admin notification for new user registration
 */
export async function sendNewUserNotificationEmail(
  data: NewUserRegistrationNotificationEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.adminEmail,
    subject: `New User Registration - ${data.userName}`,
    template: NewUserNotificationEmail,
    templateProps: {
      userName: data.userName,
      userEmail: data.userEmail,
      userPhone: data.userPhone,
      registrationDate: data.registrationDate,
      userDetailsUrl: data.userDetailsUrl,
    },
  });
}

/**
 * Send admin notification for a new vendor application
 */
export async function sendNewVendorApplicationNotificationEmail(
  data: NewVendorApplicationNotificationEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.adminEmail,
    subject: `New Vendor Application - ${data.companyName}`,
    template: NewVendorApplicationNotificationEmail,
    templateProps: {
      applicationReference: data.applicationReference,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      businessPhone: data.businessPhone,
      companyName: data.companyName,
      submittedDate: data.submittedDate,
      applicationDetailsUrl: data.applicationDetailsUrl,
    },
  });
}

/**
 * Send admin notification for new booking
 */
export async function sendNewBookingNotificationEmail(
  data: NewBookingNotificationEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.adminEmail,
    subject: `New Booking - #${data.tripNumber || data.bookingReference}`,
    template: NewBookingNotificationEmail,
    templateProps: {
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      vehicleCategory: data.vehicleCategory,
      vehicleType: data.vehicleType,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      totalAmount: data.totalAmount,
      currency: data.currency,
      bookingDetailsUrl: data.bookingDetailsUrl,
    },
  });
}