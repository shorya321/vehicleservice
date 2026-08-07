/**
 * End-to-end proof that sendEmail can render a real template and deliver it over a
 * real socket, rather than only satisfying a mock.
 *
 * This is the test that would have caught the requireTLS problem: with TLS demanded
 * unconditionally, every send against a plaintext local catcher fails, which would have
 * made the whole feature untestable on a developer machine.
 */

import { clearMailConfigCache } from '@/lib/email/transport/resolve-config';
import { clearTransporterCache } from '@/lib/email/transport/transporter';
import { formatAddress } from '@/lib/email/transport/deliver';
import { sendEmail } from '@/lib/email/utils/send-email';
import BusinessWelcomePendingEmail from '@/lib/email/templates/business/welcome-pending';
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
  process.env.PLATFORM_SMTP_PASS = 'test-api-key';
  process.env.RESEND_FROM_EMAIL = 'noreply@infiniatransfers.com';
  process.env.RESEND_REPLY_TO_EMAIL = 'support@infiniatransfers.com';

  clearMailConfigCache();
  clearTransporterCache();
});

afterEach(async () => {
  clearTransporterCache();
  clearMailConfigCache();
  await sink.close();
  process.env = { ...originalEnv };
});

function send() {
  return sendEmail({
    businessAccountId: null,
    to: 'owner@acmehotel.com',
    subject: 'Welcome to Infinia Transfers',
    template: BusinessWelcomePendingEmail,
    templateProps: {
      businessName: 'Acme Hotel',
      contactPersonName: 'Dana Reed',
      businessEmail: 'owner@acmehotel.com',
    },
  });
}

describe('smtp delivery', () => {
  it('delivers a rendered template over a real SMTP conversation', async () => {
    const result = await send();

    expect(result.success).toBe(true);
    expect(result.provider).toBe('platform_smtp');
    expect(sink.messages).toHaveLength(1);
  });

  it('authenticates before sending', async () => {
    await send();

    expect(sink.messages[0].authenticated).toBe(true);
  });

  it('uses the configured envelope sender and recipient', async () => {
    await send();

    expect(sink.messages[0].mailFrom).toBe('<noreply@infiniatransfers.com>');
    expect(sink.messages[0].rcptTo).toEqual(['<owner@acmehotel.com>']);
  });

  it('sets a display name on the From header and honours reply-to', async () => {
    await send();
    const { data } = sink.messages[0];

    expect(data).toContain('From: Infinia Transfers <noreply@infiniatransfers.com>');
    expect(data).toContain('Reply-To: support@infiniatransfers.com');
    expect(data).toContain('Subject: Welcome to Infinia Transfers');
  });

  it('sends both a plain text and an html part', async () => {
    await send();
    const { data } = sink.messages[0];

    expect(data).toContain('multipart/alternative');
    expect(data).toContain('text/plain');
    expect(data).toContain('text/html');
  });

  it('renders the template content, not an empty shell', async () => {
    await send();

    // Quoted-printable can break long lines, so assert on a short distinctive token.
    const body = sink.messages[0].data.replace(/=\r?\n/g, '');
    expect(body).toContain('Acme Hotel');
  });

  it('reports failure without throwing when nothing is listening', async () => {
    await sink.close();

    const result = await send();

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('leaves the transport untouched when MAIL_TRANSPORT is not smtp', async () => {
    process.env.MAIL_TRANSPORT = 'resend';
    process.env.RESEND_API_KEY = 'not-a-real-key';
    clearMailConfigCache();

    const result = await send();

    // The Resend SDK is exercised, not our SMTP path, so the sink stays empty.
    expect(sink.messages).toHaveLength(0);
    expect(result.success).toBe(false);
  });
});

describe('formatAddress', () => {
  it('omits the display name when there is none', () => {
    expect(formatAddress('', 'a@b.com')).toBe('a@b.com');
  });

  it('quotes a display name containing an address separator', () => {
    expect(formatAddress('Acme, Inc <ops>', 'a@b.com')).toBe('"Acme, Inc <ops>" <a@b.com>');
  });

  it('escapes embedded quotes', () => {
    expect(formatAddress('The "Best" Hotel', 'a@b.com')).toBe('"The \\"Best\\" Hotel" <a@b.com>');
  });
});
