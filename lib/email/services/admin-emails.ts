'use server';

import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type NewUserRegistrationNotificationEmailData,
  type NewBookingNotificationEmailData,
} from '../types';
import NewUserNotificationEmail from '../templates/admin/new-user-notification';
import NewBookingNotificationEmail from '../templates/admin/new-booking-notification';

/**
 * Send admin notification for new user registration
 */
export async function sendNewUserNotificationEmail(
  data: NewUserRegistrationNotificationEmailData
): Promise<EmailResult> {
  return sendEmail({
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
 * Send admin notification for new booking
 */
export async function sendNewBookingNotificationEmail(
  data: NewBookingNotificationEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.adminEmail,
    subject: `New Booking - #${data.bookingReference}`,
    template: NewBookingNotificationEmail,
    templateProps: {
      bookingReference: data.bookingReference,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      vehicleCategory: data.vehicleCategory,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDate: data.pickupDate,
      totalAmount: data.totalAmount,
      currency: data.currency,
      bookingDetailsUrl: data.bookingDetailsUrl,
    },
  });
}
