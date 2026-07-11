import { getAppUrl } from '../config';

export type EmailTemplateType =
  | 'welcome'
  | 'verification'
  | 'passwordReset'
  | 'bookingConfirmation'
  | 'bookingStatus'
  | 'vendorReceived'
  | 'vendorApproved'
  | 'vendorRejected'
  | 'vendorBookingAssigned'
  | 'driverAssigned'
  | 'businessCustomerDriverAssigned'
  | 'businessDriverAssigned';

export interface EmailTemplate {
  id: EmailTemplateType;
  name: string;
  category: 'auth' | 'booking' | 'vendor';
  description: string;
  subject: string;
  variables: string[];
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    category: 'auth',
    description: 'Sent when a new user registers with verification link',
    subject: 'Welcome to Infinia Transfers - Verify Your Email',
    variables: ['name', 'verificationUrl'],
  },
  {
    id: 'verification',
    name: 'Email Verification',
    category: 'auth',
    description: 'Standalone email verification link',
    subject: 'Verify Your Email Address',
    variables: ['name', 'verificationUrl'],
  },
  {
    id: 'passwordReset',
    name: 'Password Reset',
    category: 'auth',
    description: 'Sent when user requests password reset',
    subject: 'Reset Your Password - Infinia Transfers',
    variables: ['name', 'resetUrl'],
  },
  {
    id: 'bookingConfirmation',
    name: 'Booking Confirmation',
    category: 'booking',
    description: 'Sent after successful booking payment',
    subject: 'Booking Confirmed - {bookingReference}',
    variables: [
      'customerName',
      'bookingReference',
      'vehicleCategory',
      'pickupLocation',
      'dropoffLocation',
      'pickupDate',
      'pickupTime',
      'dropoffDate',
      'dropoffTime',
      'totalAmount',
      'currency',
    ],
  },
  {
    id: 'bookingStatus',
    name: 'Booking Status Update',
    category: 'booking',
    description: 'Sent when booking status changes',
    subject: 'Booking Status Update - {bookingReference}',
    variables: [
      'customerName',
      'bookingReference',
      'previousStatus',
      'newStatus',
      'statusMessage',
      'vehicleCategory',
      'pickupDate',
    ],
  },
  {
    id: 'vendorReceived',
    name: 'Vendor Application Received',
    category: 'vendor',
    description: 'Confirmation that vendor application was received',
    subject: 'Vendor Application Received - Infinia Transfers',
    variables: ['name', 'applicationReference', 'submittedDate'],
  },
  {
    id: 'vendorApproved',
    name: 'Vendor Application Approved',
    category: 'vendor',
    description: 'Notification that vendor application was approved',
    subject: 'Congratulations! Your Vendor Application Approved',
    variables: ['name', 'applicationReference', 'loginUrl', 'dashboardUrl'],
  },
  {
    id: 'vendorRejected',
    name: 'Vendor Application Rejected',
    category: 'vendor',
    description: 'Notification that vendor application was rejected',
    subject: 'Vendor Application Update - Infinia Transfers',
    variables: ['name', 'applicationReference', 'rejectionReason', 'reapplyUrl'],
  },
  {
    id: 'vendorBookingAssigned',
    name: 'Vendor Booking Assigned',
    category: 'vendor',
    description: 'Sent when a booking is assigned to a vendor by admin',
    subject: 'New Booking Assignment - #{bookingReference}',
    variables: [
      'vendorName',
      'bookingReference',
      'customerName',
      'vehicleCategory',
      'vehicleType',
      'pickupLocation',
      'dropoffLocation',
      'pickupDate',
      'pickupTime',
      'bookingUrl',
    ],
  },
  {
    id: 'driverAssigned',
    name: 'Driver Assigned (Customer)',
    category: 'booking',
    description: 'Sent to the customer when a vendor assigns a driver to their booking',
    subject: 'Your Driver Has Been Assigned - #{bookingReference}',
    variables: [
      'customerName',
      'bookingReference',
      'driverName',
      'driverPhone',
      'pickupDate',
      'pickupTime',
      'accountUrl',
    ],
  },
  {
    id: 'businessCustomerDriverAssigned',
    name: 'Driver Assigned (Business Passenger)',
    category: 'booking',
    description:
      'Sent to the passenger of a business booking when a vendor assigns a driver',
    subject: 'Your Driver Has Been Assigned - #{bookingReference}',
    variables: [
      'customerName',
      'bookingReference',
      'driverName',
      'driverPhone',
      'pickupDate',
      'pickupTime',
    ],
  },
  {
    id: 'businessDriverAssigned',
    name: 'Driver Assigned (Business Account)',
    category: 'booking',
    description:
      'Sent to the business account when a vendor assigns a driver to one of their bookings',
    subject: 'Driver Assigned - #{bookingReference}',
    variables: [
      'businessName',
      'passengerName',
      'bookingReference',
      'driverName',
      'driverPhone',
      'pickupDate',
      'pickupTime',
      'bookingUrl',
    ],
  },
];

export const emailPreviewData: Record<EmailTemplateType, any> = {
  welcome: {
    name: 'John Doe',
    verificationUrl: `${getAppUrl()}/verify-email?token=sample_abc123xyz456`,
  },
  verification: {
    name: 'John Doe',
    verificationUrl: `${getAppUrl()}/verify-email?token=sample_abc123xyz456`,
  },
  passwordReset: {
    name: 'John Doe',
    resetUrl: `${getAppUrl()}/reset-password?token=sample_reset123`,
  },
  bookingConfirmation: {
    customerName: 'Sarah Johnson',
    bookingReference: 'BK-2024-001234',
    tripNumber: 'INFTAH062601',
    vehicleCategory: 'Luxury Sedan',
    pickupLocation: 'Dubai International Airport (DXB)',
    dropoffLocation: 'Burj Khalifa, Downtown Dubai',
    pickupDate: 'March 15, 2024',
    pickupTime: '2:30 PM',
    dropoffDate: 'March 15, 2024',
    dropoffTime: '4:00 PM',
    totalAmount: 250,
    currency: 'AED',
  },
  bookingStatus: {
    customerName: 'Sarah Johnson',
    bookingReference: 'BK-2024-001234',
    tripNumber: 'INFTAH062602',
    previousStatus: 'Pending',
    newStatus: 'Confirmed',
    statusMessage:
      'Your booking has been confirmed. A driver will be assigned shortly.',
    vehicleCategory: 'Luxury Sedan',
    pickupDate: 'March 15, 2024',
  },
  vendorReceived: {
    name: 'Ahmed Transportation LLC',
    applicationReference: 'VA-2024-5678',
    submittedDate: 'March 10, 2024',
  },
  vendorApproved: {
    name: 'Ahmed Transportation LLC',
    applicationReference: 'VA-2024-5678',
    loginUrl: `${getAppUrl()}/login`,
    dashboardUrl: `${getAppUrl()}/vendor/dashboard`,
  },
  vendorRejected: {
    name: 'Ahmed Transportation LLC',
    applicationReference: 'VA-2024-5678',
    rejectionReason:
      'Incomplete documentation. Please submit your business license and insurance certificates.',
    reapplyUrl: `${getAppUrl()}/become-vendor`,
  },
  vendorBookingAssigned: {
    vendorName: 'Ahmed Transportation LLC',
    bookingReference: 'BK-2024-001234',
    tripNumber: 'INFTAH062603',
    customerName: 'Sarah Johnson',
    vehicleCategory: 'Luxury Sedan',
    vehicleType: 'Mercedes S-Class',
    pickupLocation: 'Dubai International Airport (DXB)',
    dropoffLocation: 'Burj Khalifa, Downtown Dubai',
    pickupDate: 'March 15, 2024',
    pickupTime: '2:30 PM',
    bookingUrl: `${getAppUrl()}/vendor/bookings`,
  },
  driverAssigned: {
    customerName: 'Sarah Johnson',
    bookingReference: 'BK-2024-001234',
    tripNumber: 'INFTAH062604',
    driverName: 'Rajesh Kumar',
    driverPhone: '+971 50 123 4567',
    pickupDate: 'March 15, 2024',
    pickupTime: '2:30 PM',
    accountUrl: `${getAppUrl()}/account`,
  },
  businessCustomerDriverAssigned: {
    customerName: 'Sarah Johnson',
    bookingReference: 'BK-2024-001234',
    tripNumber: 'INFTAH062605',
    driverName: 'Rajesh Kumar',
    driverPhone: '+971 50 123 4567',
    pickupDate: 'March 15, 2024',
    pickupTime: '2:30 PM',
  },
  businessDriverAssigned: {
    businessName: 'Acme Hotel Group',
    passengerName: 'Sarah Johnson',
    bookingReference: 'BK-2024-001234',
    tripNumber: 'INFTAH062606',
    driverName: 'Rajesh Kumar',
    driverPhone: '+971 50 123 4567',
    pickupDate: 'March 15, 2024',
    pickupTime: '2:30 PM',
    bookingUrl: `${getAppUrl()}/business/bookings/sample-booking-id`,
  },
};

export function getTemplateById(id: EmailTemplateType): EmailTemplate | undefined {
  return emailTemplates.find((template) => template.id === id);
}

export function getTemplatePreviewData(id: EmailTemplateType): any {
  return emailPreviewData[id] || {};
}

export function getTemplatesByCategory(category: 'auth' | 'booking' | 'vendor'): EmailTemplate[] {
  return emailTemplates.filter((template) => template.category === category);
}
