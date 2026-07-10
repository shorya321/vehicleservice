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
  vehicleType?: string;
  passengerCapacity?: number;
  luggageCapacity?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  totalAmount: number;
  currency: string;
  bookingReference: string;
  tripNumber?: string;
  originalAmount?: number;
  originalCurrency?: string;
  passengerCount?: number;
  basePrice?: number;
  amenitiesPrice?: number;
  extras?: Array<{ label: string; quantity: number; price: number }>;
  customerNotes?: string;
}

export interface BookingStatusUpdateEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  tripNumber?: string;
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
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
}

export interface BookingUnassignmentEmailData {
  vendorName: string;
  vendorEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  reassignmentReason?: string;
  bookingUrl: string;
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
  tripNumber?: string;
  customerName: string;
  customerEmail: string;
  vehicleCategory: string;
  vehicleType?: string;
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

// Booking datetime modification notification
export interface BookingDatetimeModifiedEmailData {
  vendorEmail: string;
  vendorName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupAddress: string;
  previousDatetime: string;
  newDatetime: string;
  modificationReason?: string;
  bookingUrl: string;
}

// Driver notification emails
export interface DriverBookingAssignmentEmailData {
  driverName: string;
  driverEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  vendorName: string;
}

export interface DriverBookingUnassignmentEmailData {
  driverName: string;
  driverEmail: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  reason?: string;
  vendorName: string;
}

// Business customer emails (sent to end customer when business books on their behalf)
export interface BusinessCustomerBookingConfirmationEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  passengerCount: number;
  referenceNumber?: string;
  extras?: Array<{ label: string; quantity: number; price: number }>;
}

export interface BusinessCustomerDatetimeChangedEmailData {
  customerName: string;
  customerEmail: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  previousDateTime: string;
  newDateTime: string;
  modificationReason?: string;
}

export interface BusinessCustomerBookingCancelledEmailData {
  customerName: string;
  customerEmail: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
}

export interface BusinessBookingStatusUpdateEmailData {
  email: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
}
