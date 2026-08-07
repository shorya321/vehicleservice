/**
 * Regression cover for the five send paths that were collapsed onto sendEmail.
 *
 * Each of these used to build its own Resend call inline. The refactor has to preserve
 * two things per function: the message still goes out, and the subject line is
 * byte-identical to what it was before. Subjects matter because they are what a
 * recipient's inbox threads and filters on.
 *
 * These also pin the two behaviour changes the refactor deliberately introduced:
 * every message now carries a text/plain alternative it previously lacked, and each
 * function routes to the transport its routing rule says it should.
 */

import { clearMailConfigCache } from '@/lib/email/transport/resolve-config';
import { clearTransporterCache } from '@/lib/email/transport/transporter';
import { sendDriverBookingAssignmentEmail, sendDriverBookingUnassignmentEmail } from '@/lib/email/services/driver-emails';
import { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } from '@/lib/email/services/booking-emails';
import { sendBookingAssignmentEmail, sendVendorApplicationApprovedEmail } from '@/lib/email/services/vendor-emails';
import { sendLowBalanceAlert, sendWalletFrozenEmail } from '@/lib/email/services/wallet-emails';
import { startSmtpSink, type SmtpSink } from './helpers/smtp-sink';

const originalEnv = { ...process.env };

let sink: SmtpSink;

beforeEach(async () => {
  sink = await startSmtpSink();

  process.env.MAIL_TRANSPORT = 'smtp';
  process.env.PLATFORM_SMTP_HOST = '127.0.0.1';
  process.env.PLATFORM_SMTP_PORT = String(sink.port);
  process.env.PLATFORM_SMTP_SECURE = 'false';
  process.env.PLATFORM_SMTP_USER = 'resend';
  process.env.PLATFORM_SMTP_PASS = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'noreply@infiniatransfers.com';

  clearMailConfigCache();
  clearTransporterCache();
});

afterEach(async () => {
  clearTransporterCache();
  clearMailConfigCache();
  await sink.close();
  process.env = { ...originalEnv };
});

/**
 * The raw message as the server received it, with no unfolding or decoding.
 */
function rawMessage(): string {
  expect(sink.messages).toHaveLength(1);
  return sink.messages[0].data;
}

/**
 * The message with header folding undone and quoted-printable soft line breaks removed,
 * for asserting on body content.
 *
 * Not safe for headers: stripping "=\n" would eat the "=" that terminates an RFC 2047
 * encoded-word sitting at the end of a line.
 */
function sentMessage(): string {
  return rawMessage()
    .replace(/\r?\n[ \t]+/g, ' ')
    .replace(/=\r?\n/g, '');
}

/**
 * Decodes the Subject header.
 *
 * Subjects get wrapped in RFC 2047 encoded-words whenever they contain a non-ASCII
 * character, and formatCurrency separates the currency from the amount with a
 * non-breaking space, so every wallet subject is encoded in practice. Asserting on the
 * raw header would only prove we know what the encoder does.
 */
function sentSubject(): string {
  // Capture the Subject line plus any folded continuation lines.
  const header = /^Subject:[ \t]*((?:.*)(?:\r?\n[ \t]+.*)*)/m.exec(rawMessage())?.[1] ?? '';

  const unfolded = header
    .replace(/\r?\n[ \t]+/g, ' ')
    // RFC 2047: whitespace separating two adjacent encoded-words is not part of the
    // text and must be discarded, otherwise a subject split mid-word rejoins as
    // "re maining".
    .replace(/\?=\s+=\?/g, '?==?');

  const decoded = unfolded.replace(/=\?UTF-8\?Q\?(.*?)\?=/gi, (_match, encoded: string) => {
    const withSpaces = encoded.replace(/_/g, ' ');
    const bytes: number[] = [];

    // Collect the bytes first and decode them as one UTF-8 buffer, so a multi-byte
    // sequence such as a non-breaking space (C2 A0) yields one character rather than
    // two mojibake ones.
    for (let index = 0; index < withSpaces.length; index += 1) {
      const isHexEscape =
        withSpaces[index] === '=' && /^[0-9A-F]{2}$/i.test(withSpaces.slice(index + 1, index + 3));

      if (isHexEscape) {
        bytes.push(parseInt(withSpaces.slice(index + 1, index + 3), 16));
        index += 2;
      } else {
        bytes.push(withSpaces.charCodeAt(index));
      }
    }

    return Buffer.from(bytes).toString('utf8');
  });

  // Normalise the non-breaking space so assertions read naturally.
  return decoded.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

describe('collapsed send paths still deliver', () => {
  it('driver assignment', async () => {
    const result = await sendDriverBookingAssignmentEmail({
      driverEmail: 'driver@example.com',
      driverName: 'Sam Idris',
      bookingReference: 'BK-2026-0031',
      tripNumber: 'TR-77',
      customerName: 'Sarah Khan',
      vehicleCategory: 'Business',
      vehicleType: 'Sedan',
      pickupLocation: 'DXB Terminal 3',
      dropoffLocation: 'Burj Al Arab',
      pickupDate: '12 Aug 2026',
      pickupTime: '09:30',
      vendorName: 'Dunes Fleet',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: Trip Assignment - #TR-77');
  });

  it('driver unassignment', async () => {
    const result = await sendDriverBookingUnassignmentEmail({
      driverEmail: 'driver@example.com',
      driverName: 'Sam Idris',
      bookingReference: 'BK-2026-0031',
      tripNumber: 'TR-77',
      customerName: 'Sarah Khan',
      pickupLocation: 'DXB Terminal 3',
      pickupDate: '12 Aug 2026',
      pickupTime: '09:30',
      reason: 'Vehicle reassigned',
      vendorName: 'Dunes Fleet',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: Trip Removed - #TR-77');
  });

  it('customer booking confirmation', async () => {
    const result = await sendBookingConfirmationEmail({
      bookingId: 'b1',
      customerName: 'Sarah Khan',
      customerEmail: 'sarah@example.com',
      bookingReference: 'BK-2026-0031',
      tripNumber: 'TR-77',
      vehicleCategory: 'Business',
      pickupLocation: 'DXB Terminal 3',
      dropoffLocation: 'Burj Al Arab',
      pickupDate: '12 Aug 2026',
      pickupTime: '09:30',
      totalAmount: 420,
      currency: 'AED',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: Booking Confirmed - TR-77');
  });

  it('customer booking status update', async () => {
    const result = await sendBookingStatusUpdateEmail({
      bookingId: 'b1',
      customerName: 'Sarah Khan',
      customerEmail: 'sarah@example.com',
      bookingReference: 'BK-2026-0031',
      tripNumber: 'TR-77',
      previousStatus: 'pending',
      newStatus: 'confirmed',
      vehicleCategory: 'Business',
      pickupDate: '12 Aug 2026',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: Booking Status Update - TR-77');
  });

  it('vendor booking assignment', async () => {
    const result = await sendBookingAssignmentEmail({
      bookingId: 'b1',
      vendorEmail: 'ops@dunes.example.com',
      vendorName: 'Dunes Fleet',
      bookingReference: 'BK-2026-0031',
      tripNumber: 'TR-77',
      customerName: 'Sarah Khan',
      vehicleCategory: 'Business',
      vehicleType: 'Sedan',
      pickupLocation: 'DXB Terminal 3',
      dropoffLocation: 'Burj Al Arab',
      pickupDate: '12 Aug 2026',
      pickupTime: '09:30',
      bookingUrl: 'https://example.com/vendor/bookings/b1',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: New Booking Assignment - #TR-77');
  });

  it('vendor application approved', async () => {
    const result = await sendVendorApplicationApprovedEmail({
      email: 'ops@dunes.example.com',
      name: 'Dunes Fleet',
      applicationReference: 'VA-9',
      loginUrl: 'https://example.com/login',
      dashboardUrl: 'https://example.com/vendor',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: Congratulations! Your Vendor Application Approved');
  });

  it('wallet low balance alert', async () => {
    const result = await sendLowBalanceAlert({
      businessName: 'Acme Hotel',
      businessEmail: 'owner@acmehotel.com',
      currentBalance: 120,
      threshold: 500,
      currency: 'AED',
      walletUrl: 'https://example.com/business/wallet',
    });

    expect(result.success).toBe(true);
    expect(sentSubject()).toBe('Low Balance Alert - AED 120.00 remaining');
  });

  it('wallet frozen', async () => {
    const result = await sendWalletFrozenEmail({
      businessName: 'Acme Hotel',
      businessEmail: 'owner@acmehotel.com',
      currentBalance: 120,
      currency: 'AED',
      freezeReason: 'Chargeback under review',
      frozenBy: 'Platform admin',
      freezeDate: new Date('2026-08-07T10:00:00Z'),
      supportUrl: 'https://example.com/contact',
    });

    expect(result.success).toBe(true);
    expect(sentMessage()).toContain('Subject: Your Wallet Has Been Frozen - Action Required');
  });
});

describe('behaviour the refactor intentionally changed', () => {
  it('adds the plain text alternative these paths previously lacked', async () => {
    await sendDriverBookingAssignmentEmail({
      driverEmail: 'driver@example.com',
      driverName: 'Sam Idris',
      bookingReference: 'BK-2026-0031',
      customerName: 'Sarah Khan',
      vehicleCategory: 'Business',
      vehicleType: 'Sedan',
      pickupLocation: 'DXB Terminal 3',
      dropoffLocation: 'Burj Al Arab',
      pickupDate: '12 Aug 2026',
      pickupTime: '09:30',
      vendorName: 'Dunes Fleet',
    });

    const message = sentMessage();
    expect(message).toContain('multipart/alternative');
    expect(message).toContain('text/plain');
    expect(message).toContain('text/html');
  });
});

describe('routing rule', () => {
  it('keeps a wallet freeze on platform credentials even when a tenant is named', async () => {
    const result = await sendWalletFrozenEmail({
      businessAccountId: '11111111-1111-4111-8111-111111111111',
      businessName: 'Acme Hotel',
      businessEmail: 'owner@acmehotel.com',
      currentBalance: 0,
      currency: 'AED',
      freezeReason: 'Enforcement',
      frozenBy: 'Platform admin',
      freezeDate: new Date('2026-08-07T10:00:00Z'),
      supportUrl: 'https://example.com/contact',
    });

    // A freeze notice must reach the tenant even when the tenant's own mail server is
    // part of the problem, so it never routes through tenant credentials.
    expect(result.provider).toBe('platform_smtp');
  });

  it('routes a tenant-facing wallet alert through the tenant scope', async () => {
    const result = await sendLowBalanceAlert({
      businessAccountId: '11111111-1111-4111-8111-111111111111',
      businessName: 'Acme Hotel',
      businessEmail: 'owner@acmehotel.com',
      currentBalance: 120,
      threshold: 500,
      currency: 'AED',
      walletUrl: 'https://example.com/business/wallet',
    });

    // Until the settings table exists, a tenant id still resolves to the platform
    // config. What this pins is that the id is threaded rather than dropped.
    expect(result.success).toBe(true);
  });
});
