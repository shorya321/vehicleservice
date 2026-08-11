/**
 * The regression gate for every email the business module does NOT own.
 *
 * The business email work adds a colors block to EmailBrand and changes where the brand
 * scope is entered in the sender. Neither should be visible to a customer, a vendor, a
 * driver, or anyone receiving platform mail. "Should not be visible" is worth exactly
 * nothing as a claim, so this renders all 28 shared templates and pins the bytes.
 *
 * If a snapshot here changes, a shared template regressed. That is a blocker, not an
 * improvement to be accepted with -u.
 *
 * Business templates are deliberately absent: they are expected to change, and they live
 * in lib/business/email/ where this file has no business looking.
 */

import { jsx } from 'react/jsx-runtime';
import { render } from '@react-email/render';
import type React from 'react';

// Registers the AsyncLocalStorage-backed brand resolver, exactly as the sender does.
import { runWithBrand } from '@/lib/email/brand/brand-store.server';
import { getPlatformBrand } from '@/lib/email/brand/brand';

import NewBookingNotificationEmail from '@/lib/email/templates/admin/new-booking-notification';
import NewUserNotificationEmail from '@/lib/email/templates/admin/new-user-notification';
import PasswordResetEmail from '@/lib/email/templates/auth/password-reset';
import VerificationEmail from '@/lib/email/templates/auth/verification';
import WelcomeEmail from '@/lib/email/templates/auth/welcome';
import BookingConfirmationEmail from '@/lib/email/templates/booking/confirmation';
import BookingDriverAssignedEmail from '@/lib/email/templates/booking/driver-assigned';
import BookingStatusUpdateEmail from '@/lib/email/templates/booking/status-update';
import ContactAdminNotificationEmail from '@/lib/email/templates/contact/admin-notification';
import ContactReplyEmail from '@/lib/email/templates/contact/reply-notification';
import ContactConfirmationEmail from '@/lib/email/templates/contact/submission-confirmation';
import DirectBookingCustomerCancelledEmail from '@/lib/email/templates/direct-booking/customer-cancelled';
import DirectBookingCustomerConfirmationEmail from '@/lib/email/templates/direct-booking/customer-confirmation';
import DirectBookingCustomerStatusUpdateEmail from '@/lib/email/templates/direct-booking/customer-status-update';
import DirectBookingDriverAssignmentEmail from '@/lib/email/templates/direct-booking/driver-assignment';
import DriverBookingAssignedEmail from '@/lib/email/templates/driver/booking-assigned';
import DriverBookingUnassignedEmail from '@/lib/email/templates/driver/booking-unassigned';
import VendorApplicationApprovedEmail from '@/lib/email/templates/vendor/application-approved';
import VendorApplicationReceivedEmail from '@/lib/email/templates/vendor/application-received';
import VendorApplicationRejectedEmail from '@/lib/email/templates/vendor/application-rejected';
import VendorBookingAssignedEmail from '@/lib/email/templates/vendor/booking-assigned';
import BookingDatetimeModifiedEmail from '@/lib/email/templates/vendor/booking-datetime-modified';
import VendorBookingUnassignedEmail from '@/lib/email/templates/vendor/booking-unassigned';
import LowBalanceAlertEmail from '@/lib/email/templates/wallet/low-balance-alert';
import MonthlyStatementEmail from '@/lib/email/templates/wallet/monthly-statement';
import SpendingLimitReachedEmail from '@/lib/email/templates/wallet/spending-limit-reached';
import TransactionCompletedEmail from '@/lib/email/templates/wallet/transaction-completed';
import WalletFrozenEmail from '@/lib/email/templates/wallet/wallet-frozen';

const originalEnv = { ...process.env };

beforeAll(() => {
  // platformUrl() and getAppUrl() both read the environment. Pin them, or the snapshots
  // encode whatever happened to be in .env.local on the machine that wrote them.
  process.env.NEXT_PUBLIC_APP_URL = 'https://infiniatransfers.com';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://infiniatransfers.com';
});

afterAll(() => {
  process.env = { ...originalEnv };
});

type Case = readonly [name: string, template: React.ComponentType<any>, props: Record<string, unknown>];

const CASES: readonly Case[] = [
  ['admin/new-booking-notification', NewBookingNotificationEmail, {
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    customerName: 'Sarah Khan',
    customerEmail: 'sarah@example.com',
    vehicleCategory: 'Business',
    vehicleType: 'Sedan',
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    totalAmount: 450,
    currency: 'AED',
    bookingDetailsUrl: 'https://infiniatransfers.com/admin/bookings/1',
  }],
  ['admin/new-user-notification', NewUserNotificationEmail, {
    userName: 'Sarah Khan',
    userEmail: 'sarah@example.com',
    userPhone: '+971500000000',
    registrationDate: '10 August 2026',
    userDetailsUrl: 'https://infiniatransfers.com/admin/users/1',
  }],
  ['auth/password-reset', PasswordResetEmail, {
    name: 'Sarah Khan',
    resetUrl: 'https://infiniatransfers.com/reset?token=abc',
  }],
  ['auth/verification', VerificationEmail, {
    name: 'Sarah Khan',
    verificationUrl: 'https://infiniatransfers.com/verify?token=abc',
  }],
  ['auth/welcome', WelcomeEmail, {
    name: 'Sarah Khan',
    verificationUrl: 'https://infiniatransfers.com/verify?token=abc',
  }],
  ['booking/confirmation', BookingConfirmationEmail, {
    customerName: 'Sarah Khan',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    vehicleCategory: 'Business',
    vehicleType: 'Sedan',
    passengerCapacity: 3,
    luggageCapacity: 2,
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    totalAmount: 450,
    currency: 'AED',
    originalAmount: 122,
    originalCurrency: 'USD',
    passengerCount: 3,
    adults: 2,
    children: 1,
    infants: 0,
    basePrice: 400,
    amenitiesPrice: 50,
    extras: [
      { label: 'Child seat', quantity: 1, price: 30, childAges: [4] },
      { label: 'Meet and greet', quantity: 1, price: 20 },
    ],
    customerNotes: 'Please call on arrival.',
    invoiceUrl: 'https://infiniatransfers.com/invoice/1',
  }],
  ['booking/driver-assigned', BookingDriverAssignedEmail, {
    customerName: 'Sarah Khan',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    driverName: 'Omar Aziz',
    driverPhone: '+971500000001',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    accountUrl: 'https://infiniatransfers.com/account',
  }],
  ['booking/status-update', BookingStatusUpdateEmail, {
    customerName: 'Sarah Khan',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    previousStatus: 'pending',
    newStatus: 'confirmed',
    statusMessage: 'Your driver has been arranged.',
    vehicleCategory: 'Business',
    pickupDate: '12 August 2026',
  }],
  ['contact/admin-notification', ContactAdminNotificationEmail, {
    name: 'Sarah Khan',
    email: 'sarah@example.com',
    phone: '+971500000000',
    subject: 'Question about airport pickup',
    message: 'Do you cover Al Maktoum?',
    submissionUrl: 'https://infiniatransfers.com/admin/contact/1',
  }],
  ['contact/reply-notification', ContactReplyEmail, {
    name: 'Sarah Khan',
    replyMessage: 'Yes, we cover Al Maktoum.',
  }],
  ['contact/submission-confirmation', ContactConfirmationEmail, {
    name: 'Sarah Khan',
    subject: 'Question about airport pickup',
    message: 'Do you cover Al Maktoum?',
  }],
  ['direct-booking/customer-cancelled', DirectBookingCustomerCancelledEmail, {
    customerName: 'Sarah Khan',
    bookingReference: 'DB-2026-0001',
    vehicleLabel: 'Toyota Previa',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    vendorName: 'Dunes Fleet',
    vendorPhone: '+971500000002',
  }],
  ['direct-booking/customer-confirmation', DirectBookingCustomerConfirmationEmail, {
    customerName: 'Sarah Khan',
    bookingReference: 'DB-2026-0001',
    statusLabel: 'Confirmed',
    vehicleLabel: 'Toyota Previa',
    vehicleRegistration: 'DXB-12345',
    driverName: 'Omar Aziz',
    driverPhone: '+971500000001',
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    returnDate: '14 August 2026',
    returnTime: '18:00',
    totalAmount: 900,
    amountPaid: 450,
    balanceDue: 450,
    currency: 'AED',
    paymentStatusLabel: 'Part paid',
    paymentMethodLabel: 'Cash',
    customerNotes: 'Please call on arrival.',
    vendorName: 'Dunes Fleet',
    vendorPhone: '+971500000002',
  }],
  ['direct-booking/customer-status-update', DirectBookingCustomerStatusUpdateEmail, {
    customerName: 'Sarah Khan',
    bookingReference: 'DB-2026-0001',
    previousStatusLabel: 'Pending',
    newStatusLabel: 'Confirmed',
    vehicleLabel: 'Toyota Previa',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    vendorName: 'Dunes Fleet',
    vendorPhone: '+971500000002',
  }],
  ['direct-booking/driver-assignment', DirectBookingDriverAssignmentEmail, {
    driverName: 'Omar Aziz',
    bookingReference: 'DB-2026-0001',
    customerName: 'Sarah Khan',
    vehicleLabel: 'Toyota Previa',
    vehicleRegistration: 'DXB-12345',
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    returnDate: '14 August 2026',
    returnTime: '18:00',
    vendorName: 'Dunes Fleet',
    vendorPhone: '+971500000002',
  }],
  ['driver/booking-assigned', DriverBookingAssignedEmail, {
    driverName: 'Omar Aziz',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    customerName: 'Sarah Khan',
    vehicleCategory: 'Business',
    vehicleType: 'Sedan',
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    vendorName: 'Dunes Fleet',
  }],
  ['driver/booking-unassigned', DriverBookingUnassignedEmail, {
    driverName: 'Omar Aziz',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    customerName: 'Sarah Khan',
    pickupLocation: 'DXB Terminal 3',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    reason: 'Vehicle unavailable',
    vendorName: 'Dunes Fleet',
  }],
  ['vendor/application-approved', VendorApplicationApprovedEmail, {
    name: 'Dunes Fleet',
    applicationReference: 'VA-9',
    loginUrl: 'https://infiniatransfers.com/login',
    dashboardUrl: 'https://infiniatransfers.com/vendor',
  }],
  ['vendor/application-received', VendorApplicationReceivedEmail, {
    name: 'Dunes Fleet',
    applicationReference: 'VA-9',
    submittedDate: '10 August 2026',
  }],
  ['vendor/application-rejected', VendorApplicationRejectedEmail, {
    name: 'Dunes Fleet',
    applicationReference: 'VA-9',
    rejectionReason: 'Insurance documents expired.',
    reapplyUrl: 'https://infiniatransfers.com/vendor/apply',
  }],
  ['vendor/booking-assigned', VendorBookingAssignedEmail, {
    vendorName: 'Dunes Fleet',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    customerName: 'Sarah Khan',
    vehicleCategory: 'Business',
    vehicleType: 'Sedan',
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    bookingUrl: 'https://infiniatransfers.com/vendor/bookings/1',
  }],
  ['vendor/booking-datetime-modified', BookingDatetimeModifiedEmail, {
    vendorName: 'Dunes Fleet',
    bookingNumber: 'BK-2026-0001',
    tripNumber: 'TR-01',
    customerName: 'Sarah Khan',
    pickupAddress: 'DXB Terminal 3',
    previousDatetime: '12 August 2026 at 09:30',
    newDatetime: '12 August 2026 at 11:00',
    modificationReason: 'Flight delayed',
    bookingUrl: 'https://infiniatransfers.com/vendor/bookings/1',
  }],
  ['vendor/booking-unassigned', VendorBookingUnassignedEmail, {
    vendorName: 'Dunes Fleet',
    bookingReference: 'BK-2026-0001',
    tripNumber: 'TR-01',
    customerName: 'Sarah Khan',
    pickupLocation: 'DXB Terminal 3',
    pickupDate: '12 August 2026',
    pickupTime: '09:30',
    reassignmentReason: 'Vendor unavailable',
    bookingUrl: 'https://infiniatransfers.com/vendor/bookings/1',
  }],
  ['wallet/low-balance-alert', LowBalanceAlertEmail, {
    businessName: 'Acme Hotel Group',
    currentBalance: 250,
    threshold: 500,
    currency: 'AED',
    walletUrl: 'https://infiniatransfers.com/business/wallet',
  }],
  ['wallet/monthly-statement', MonthlyStatementEmail, {
    businessName: 'Acme Hotel Group',
    statementMonth: 'July',
    statementYear: 2026,
    openingBalance: 1000,
    closingBalance: 750,
    totalCredits: 500,
    totalDebits: 750,
    transactionCount: 12,
    currency: 'AED',
    pdfUrl: 'https://infiniatransfers.com/statement.pdf',
    walletUrl: 'https://infiniatransfers.com/business/wallet',
  }],
  ['wallet/spending-limit-reached', SpendingLimitReachedEmail, {
    businessName: 'Acme Hotel Group',
    limitType: 'daily',
    limitAmount: 5000,
    currentSpend: 5000,
    currency: 'AED',
    rejectedTransactionAmount: 450,
    resetDate: '11 August 2026',
    walletUrl: 'https://infiniatransfers.com/business/wallet',
    supportUrl: 'https://infiniatransfers.com/support',
  }],
  ['wallet/transaction-completed', TransactionCompletedEmail, {
    businessName: 'Acme Hotel Group',
    transactionType: 'credit',
    amount: 500,
    currency: 'AED',
    description: 'Wallet top up',
    previousBalance: 250,
    newBalance: 750,
    transactionDate: '10 August 2026',
    transactionId: 'TXN-0001',
    walletUrl: 'https://infiniatransfers.com/business/wallet',
  }],
  ['wallet/wallet-frozen', WalletFrozenEmail, {
    businessName: 'Acme Hotel Group',
    currentBalance: 750,
    currency: 'AED',
    freezeReason: 'Pending compliance review',
    frozenBy: 'Platform admin',
    freezeDate: '10 August 2026',
    supportUrl: 'https://infiniatransfers.com/support',
  }],
];

describe('shared email templates render identically under the platform brand', () => {
  it.each(CASES.map(([name]) => name))('%s', async (name) => {
    const [, template, props] = CASES.find(([n]) => n === name)!;
    const element = jsx(template, props);

    // Entered exactly as the sender enters it, so the snapshot exercises the real path.
    const { html, text } = await runWithBrand(getPlatformBrand(), async () => ({
      html: await render(element),
      text: await render(element, { plainText: true }),
    }));

    expect(html).toMatchSnapshot(`${name} html`);
    expect(text).toMatchSnapshot(`${name} text`);
  });

  it('covers every shared template on disk', () => {
    // A new shared template added without a snapshot silently escapes this gate.
    expect(CASES).toHaveLength(28);
  });
});
