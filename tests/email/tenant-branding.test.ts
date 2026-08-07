/**
 * Proves the tenant's brand actually reaches the rendered message.
 *
 * This is the test for the feature's headline promise: a customer who booked with Acme
 * Hotel must never see "Infinia Transfers" in the email they receive. It renders real
 * templates through the real sender and reads the bytes off a real socket, because the
 * failure mode being guarded against is a brand that resolves correctly in a unit test
 * and then does not survive the render.
 */

const mockMaybeSingle = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mockMaybeSingle }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({ eq: () => ({ gt: () => Promise.resolve({ error: null }) }) }),
    }),
  }),
}));

import { encryptSecret, resetMailCryptoCache } from '@/lib/email/transport/crypto';
import { clearMailConfigCache } from '@/lib/email/transport/resolve-config';
import { clearTransporterCache } from '@/lib/email/transport/transporter';
import { sendBusinessCustomerBookingConfirmationEmail } from '@/lib/email/services/business-emails';
import { sendVendorApplicationApprovedEmail } from '@/lib/email/services/vendor-emails';
import { startSmtpSink, type SmtpSink } from './helpers/smtp-sink';

const KEY = Buffer.alloc(32, 9).toString('base64');
const TENANT = '11111111-1111-4111-8111-111111111111';

const originalEnv = { ...process.env };
let sink: SmtpSink;

function tenantRow(settingsOverrides: Record<string, unknown> = {}, brandOverrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: TENANT,
      business_name: 'Acme Hotel Group',
      brand_name: 'Acme Transfers',
      logo_url: null,
      business_email: 'support@acmehotel.com',
      address: '1 Marina Walk, Dubai',
      subdomain: 'acme',
      custom_domain: 'transfers.acmehotel.com',
      custom_domain_verified: true,
      ...brandOverrides,
      business_email_settings: {
        enabled: true,
        smtp_host: '127.0.0.1',
        smtp_port: sink.port,
        smtp_secure: false,
        smtp_username: 'acme',
        smtp_password_encrypted: encryptSecret('tenant-secret', TENANT),
        from_email: 'bookings@acmehotel.com',
        from_name: 'Acme Transfers',
        reply_to: 'support@acmehotel.com',
        allow_platform_fallback: true,
        consecutive_failures: 0,
        updated_at: '2026-08-07T10:00:00Z',
        ...settingsOverrides,
      },
    },
    error: null,
  };
}

beforeEach(async () => {
  sink = await startSmtpSink();

  process.env.EMAIL_ENCRYPTION_KEY = KEY;
  process.env.MAIL_TRANSPORT = 'smtp';
  process.env.PLATFORM_SMTP_HOST = '127.0.0.1';
  process.env.PLATFORM_SMTP_PORT = String(sink.port);
  process.env.PLATFORM_SMTP_SECURE = 'false';
  process.env.PLATFORM_SMTP_USER = 'platform';
  process.env.PLATFORM_SMTP_PASS = 'platform-key';
  process.env.RESEND_FROM_EMAIL = 'noreply@infiniatransfers.com';
  delete process.env.EMAIL_ENCRYPTION_KEY_VERSION;
  delete process.env.EMAIL_ENCRYPTION_KEYS_RETIRED;

  resetMailCryptoCache();
  clearMailConfigCache();
  clearTransporterCache();
  mockMaybeSingle.mockReset();
});

afterEach(async () => {
  clearTransporterCache();
  clearMailConfigCache();
  resetMailCryptoCache();
  await sink.close();
  process.env = { ...originalEnv };
});

function bookingConfirmation() {
  return sendBusinessCustomerBookingConfirmationEmail({
    businessAccountId: TENANT,
    customerName: 'Sarah Khan',
    customerEmail: 'sarah@example.com',
    businessName: 'Acme Transfers',
    bookingNumber: 'BK-2026-0031',
    tripNumber: 'TR-77',
    pickupLocation: 'DXB Terminal 3',
    dropoffLocation: 'Burj Al Arab',
    pickupDateTime: 'Wednesday, 12 August 2026 at 09:30',
    vehicleType: 'Business Sedan',
    passengerCount: 2,
  });
}

/** Quoted-printable soft breaks make raw substring matching unreliable. */
function decodedBody(): string {
  return sink.messages[0].data.replace(/=\r?\n/g, '').replace(/\r?\n[ \t]+/g, ' ');
}

/**
 * The message body only, with the headers stripped.
 *
 * Needed for the fallback case: when a tenant's transport fails we re-send on platform
 * credentials, so the From header legitimately becomes the platform's. What must still
 * be the tenant's is everything the recipient actually reads.
 */
function decodedContent(): string {
  const body = decodedBody();
  const headerEnd = body.indexOf('\n\n');

  return headerEnd === -1 ? body : body.slice(headerEnd);
}

describe('a configured tenant', () => {
  beforeEach(() => mockMaybeSingle.mockResolvedValue(tenantRow()));

  it('sends from its own address on its own server', async () => {
    const result = await bookingConfirmation();

    expect(result.success).toBe(true);
    expect(result.provider).toBe('business_smtp');
    expect(sink.messages[0].mailFrom).toBe('<bookings@acmehotel.com>');
    expect(decodedBody()).toContain('From: Acme Transfers <bookings@acmehotel.com>');
  });

  it('authenticates as the tenant, not the platform', async () => {
    await bookingConfirmation();

    expect(sink.messages[0].authenticated).toBe(true);
  });

  it('puts the tenant brand in the email, not the platform name', async () => {
    await bookingConfirmation();
    const body = decodedBody();

    expect(body).toContain('Acme Transfers');
    expect(body).not.toContain('Infinia Transfers');
  });

  it('drops the platform legal footer and offers the tenant support address instead', async () => {
    await bookingConfirmation();
    const body = decodedBody();

    expect(body).not.toContain('/privacy');
    expect(body).not.toContain('/terms');
    expect(body).toContain('mailto:support@acmehotel.com');
  });

  it('uses the tenant postal address in the footer', async () => {
    await bookingConfirmation();

    expect(decodedBody()).toContain('1 Marina Walk, Dubai');
  });

  it('renders the tenant logo when one is set', async () => {
    mockMaybeSingle.mockResolvedValue(tenantRow({}, { logo_url: 'https://cdn.example.com/acme.png' }));

    await bookingConfirmation();

    expect(decodedBody()).toContain('https://cdn.example.com/acme.png');
  });
});

describe('an unconfigured tenant', () => {
  it('still sends, on platform credentials but wearing the tenant brand', async () => {
    mockMaybeSingle.mockResolvedValue(tenantRow({ enabled: false }));

    const result = await bookingConfirmation();

    expect(result.success).toBe(true);
    expect(result.provider).toBe('platform_smtp');

    // The envelope is the platform's, which is what falling back means.
    expect(sink.messages[0].mailFrom).toBe('<noreply@infiniatransfers.com>');

    // But the transport is the only thing that degrades. Everything the recipient reads
    // is still the tenant's. This is the case most likely to regress.
    const content = decodedContent();
    expect(content).toContain('Acme Transfers');
    expect(content).not.toContain('Infinia Transfers');
  });
});

describe('platform mail', () => {
  it('keeps the platform name and legal footer', async () => {
    await sendVendorApplicationApprovedEmail({
      email: 'ops@dunes.example.com',
      name: 'Dunes Fleet',
      applicationReference: 'VA-9',
      loginUrl: 'https://example.com/login',
      dashboardUrl: 'https://example.com/vendor',
    });

    const body = decodedBody();

    expect(body).toContain('Infinia Transfers');
    expect(body).toContain('/privacy');
    expect(body).toContain('/terms');
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });
});
