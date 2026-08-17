/**
 * The one map from a preview template id to the component that renders it.
 *
 * The admin preview and the "send test email" action used to keep separate copies
 * of this. A template present in one and missing from the other renders one body
 * on screen and mails a different one, and only one of the two copies carried the
 * `Record<EmailTemplateType, ...>` annotation that would have caught it.
 *
 * Everything here is bundled for the browser, because the preview renders client
 * side. Only add templates that are pure presentation: no `node:` imports, no
 * transport, no credentials. Business templates may reach `lib/email` solely
 * through `lib/business/email/brand.ts`, which `tests/email/platform-only.test.ts`
 * enforces.
 */

import type { ComponentType } from 'react';
import type { EmailTemplateType } from './preview-data';

import WelcomeEmail from '@/lib/email/templates/auth/welcome';
import VerificationEmail from '@/lib/email/templates/auth/verification';
import PasswordResetEmail from '@/lib/email/templates/auth/password-reset';
import BookingConfirmationEmail from '@/lib/email/templates/booking/confirmation';
import BookingStatusUpdateEmail from '@/lib/email/templates/booking/status-update';
import VendorApplicationReceivedEmail from '@/lib/email/templates/vendor/application-received';
import VendorApplicationApprovedEmail from '@/lib/email/templates/vendor/application-approved';
import VendorApplicationRejectedEmail from '@/lib/email/templates/vendor/application-rejected';
import BookingAssignedEmail from '@/lib/email/templates/vendor/booking-assigned';
import BookingDriverAssignedEmail from '@/lib/email/templates/booking/driver-assigned';
import BusinessCustomerDriverAssignedEmail from '@/lib/business/email/templates/customer-driver-assigned';
import BusinessBookingDriverAssignedEmail from '@/lib/business/email/templates/booking-driver-assigned';
import DirectBookingCustomerConfirmationEmail from '@/lib/email/templates/direct-booking/customer-confirmation';
import DirectBookingCustomerStatusUpdateEmail from '@/lib/email/templates/direct-booking/customer-status-update';
import DirectBookingCustomerCancelledEmail from '@/lib/email/templates/direct-booking/customer-cancelled';
import DirectBookingDriverAssignmentEmail from '@/lib/email/templates/direct-booking/driver-assignment';
import AdminNewBookingNotificationEmail from '@/lib/email/templates/admin/new-booking-notification';
import AdminNewVendorApplicationNotificationEmail from '@/lib/email/templates/admin/new-vendor-application-notification';
import BusinessWelcomePendingEmail from '@/lib/business/email/templates/welcome-pending';
import NewBusinessRegistrationAdminNotificationEmail from '@/lib/business/email/templates/new-registration-admin-notification';
import BusinessAccountApprovedEmail from '@/lib/business/email/templates/account-approved';
import BusinessAccountRejectedEmail from '@/lib/business/email/templates/account-rejected';

/**
 * Annotated rather than inferred: the `Record` is what turns "registered an id but
 * never wired a component" into a compile error instead of a blank preview.
 */
export const templateComponents: Record<EmailTemplateType, ComponentType<any>> = {
  welcome: WelcomeEmail,
  verification: VerificationEmail,
  passwordReset: PasswordResetEmail,
  bookingConfirmation: BookingConfirmationEmail,
  bookingStatus: BookingStatusUpdateEmail,
  vendorReceived: VendorApplicationReceivedEmail,
  vendorApproved: VendorApplicationApprovedEmail,
  vendorRejected: VendorApplicationRejectedEmail,
  vendorBookingAssigned: BookingAssignedEmail,
  driverAssigned: BookingDriverAssignedEmail,
  businessCustomerDriverAssigned: BusinessCustomerDriverAssignedEmail,
  businessDriverAssigned: BusinessBookingDriverAssignedEmail,
  directBookingCustomerConfirmation: DirectBookingCustomerConfirmationEmail,
  directBookingCustomerStatusUpdate: DirectBookingCustomerStatusUpdateEmail,
  directBookingCustomerCancelled: DirectBookingCustomerCancelledEmail,
  directBookingDriverAssignment: DirectBookingDriverAssignmentEmail,
  adminNewBooking: AdminNewBookingNotificationEmail,
  adminNewVendorApplication: AdminNewVendorApplicationNotificationEmail,
  businessWelcomePending: BusinessWelcomePendingEmail,
  businessRegistrationAdminNotice: NewBusinessRegistrationAdminNotificationEmail,
  businessAccountApproved: BusinessAccountApprovedEmail,
  businessAccountRejected: BusinessAccountRejectedEmail,
};
