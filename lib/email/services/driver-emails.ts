import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type DriverBookingAssignmentEmailData,
  type DriverBookingUnassignmentEmailData,
} from '../types';
import DriverBookingAssignedEmail from '../templates/driver/booking-assigned';
import DriverBookingUnassignedEmail from '../templates/driver/booking-unassigned';

/**
 * Driver notifications always go out on platform credentials, even for a booking that
 * originated with a white-label business. Drivers are the platform's contracted
 * suppliers, not the tenant's: they need one consistent sender identity across bookings
 * from many tenants, and a tenant must not learn its suppliers' addresses by reading
 * its own SMTP logs.
 */

/**
 * Send trip assignment notification to driver
 */
export async function sendDriverBookingAssignmentEmail(
  data: DriverBookingAssignmentEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.driverEmail,
    subject: `Trip Assignment - #${data.tripNumber || data.bookingReference}`,
    template: DriverBookingAssignedEmail,
    templateProps: {
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
    },
  });
}

/**
 * Send trip removal notification to driver
 */
export async function sendDriverBookingUnassignmentEmail(
  data: DriverBookingUnassignmentEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.driverEmail,
    subject: `Trip Removed - #${data.tripNumber || data.bookingReference}`,
    template: DriverBookingUnassignedEmail,
    templateProps: {
      driverName: data.driverName,
      bookingReference: data.bookingReference,
      tripNumber: data.tripNumber,
      customerName: data.customerName,
      pickupLocation: data.pickupLocation,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      reason: data.reason,
      vendorName: data.vendorName,
    },
  });
}
