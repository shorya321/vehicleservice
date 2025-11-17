// Email sending result
export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

// Authentication emails
export interface WelcomeEmailData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface VerificationEmailData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetUrl: string;
}

// Booking emails
export interface BookingConfirmationEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  vehicleCategory: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  totalAmount: number;
  currency: string;
  bookingReference: string;
}

export interface BookingStatusUpdateEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
  vehicleCategory: string;
  pickupDate: string;
}

export interface BookingAssignmentEmailData {
  bookingId: string;
  vendorName: string;
  vendorEmail: string;
  bookingReference: string;
  customerName: string;
  vehicleCategory: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
}

// Vendor application emails
export interface VendorApplicationReceivedEmailData {
  email: string;
  name: string;
  applicationReference: string;
  submittedDate: string;
}

export interface VendorApplicationApprovedEmailData {
  email: string;
  name: string;
  applicationReference: string;
  loginUrl: string;
  dashboardUrl: string;
}

export interface VendorApplicationRejectedEmailData {
  email: string;
  name: string;
  applicationReference: string;
  rejectionReason: string;
  reapplyUrl?: string;
}

// Admin notification emails
export interface NewBookingNotificationEmailData {
  adminEmail: string;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  vehicleCategory: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  totalAmount: number;
  currency: string;
  bookingDetailsUrl: string;
}

export interface NewVendorApplicationNotificationEmailData {
  adminEmail: string;
  applicationId: string;
  applicationReference: string;
  applicantName: string;
  applicantEmail: string;
  companyName: string;
  submittedDate: string;
  applicationDetailsUrl: string;
}

export interface NewUserRegistrationNotificationEmailData {
  adminEmail: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  registrationDate: string;
  userDetailsUrl: string;
}
