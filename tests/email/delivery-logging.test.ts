/**
 * Every send must produce exactly one delivery-log row, on either transport.
 *
 * The bug this guards against: MAIL_TRANSPORT defaults to 'resend', so a business that
 * has not configured its own SMTP sends everything down the Resend path. That path did
 * not log, so the Delivery log tab stayed permanently empty for exactly the businesses
 * most likely to open it, while the empty state promised every message would be recorded
 * "whether it was delivered through your server or ours".
 *
 * Both transports are mocked here so the assertion is about logging, not delivery.
 */

// Implementations are (re)installed in beforeEach, not here: jest.config.js sets
// resetMocks: true, which wipes any implementation attached at declaration time.
const logEmail = jest.fn();
const resendSend = jest.fn();
const deliver = jest.fn();

jest.mock('@/lib/email/utils/email-log', () => ({ logEmail }));

jest.mock('@/lib/email/config', () => ({
  ...jest.requireActual('@/lib/email/config'),
  getResendClient: () => ({ emails: { send: resendSend } }),
  getEmailConfig: () => ({ from: 'noreply@platform.test', replyTo: 'support@platform.test' }),
}));

jest.mock('@/lib/email/transport/deliver', () => ({
  ...jest.requireActual('@/lib/email/transport/deliver'),
  deliver,
}));

import { sendEmail } from '@/lib/email/utils/send-email';
import { clearMailConfigCache } from '@/lib/email/transport/resolve-config';
import BusinessWelcomePendingEmail from '@/lib/business/email/templates/welcome-pending';

const originalEnv = { ...process.env };

function send() {
  return sendEmail({
    businessAccountId: null,
    kind: 'platform.welcome',
    to: 'owner@acmehotel.com',
    subject: 'Welcome',
    template: BusinessWelcomePendingEmail,
    templateProps: { businessName: 'Acme', ownerName: 'Dana', supportEmail: 's@acme.test' },
  });
}

beforeEach(() => {
  process.env.RESEND_FROM_EMAIL = 'noreply@platform.test';
  process.env.RESEND_API_KEY = 'test';
  clearMailConfigCache();
  logEmail.mockReset().mockResolvedValue(undefined);
  resendSend.mockReset();
  deliver.mockReset();
});

afterEach(() => {
  process.env = { ...originalEnv };
  clearMailConfigCache();
});

describe('the Resend transport', () => {
  beforeEach(() => {
    process.env.MAIL_TRANSPORT = 'resend';
  });

  it('logs a sent row', async () => {
    resendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });

    const result = await send();

    expect(result.success).toBe(true);
    expect(logEmail).toHaveBeenCalledTimes(1);
    expect(logEmail.mock.calls[0][0]).toMatchObject({
      status: 'sent',
      kind: 'platform.welcome',
      to: 'owner@acmehotel.com',
      messageId: 'resend-123',
    });
  });

  it('logs a failed row when the provider rejects', async () => {
    resendSend.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });

    const result = await send();

    expect(result.success).toBe(false);
    expect(logEmail).toHaveBeenCalledTimes(1);
    expect(logEmail.mock.calls[0][0]).toMatchObject({ status: 'failed' });
  });

  it('does not let a logging failure turn a delivered email into a failure', async () => {
    resendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });
    logEmail.mockRejectedValueOnce(new Error('log table unreachable'));

    await expect(send()).resolves.toMatchObject({ success: true });
  });
});

describe('the SMTP transport', () => {
  beforeEach(() => {
    process.env.MAIL_TRANSPORT = 'smtp';
  });

  it('logs a sent row', async () => {
    deliver.mockResolvedValue({
      messageId: 'smtp-1',
      provider: 'platform_smtp',
      durationMs: 12,
      response: '250 ok',
    });

    const result = await send();

    expect(result.success).toBe(true);
    expect(logEmail).toHaveBeenCalledTimes(1);
    expect(logEmail.mock.calls[0][0]).toMatchObject({ status: 'sent', messageId: 'smtp-1' });
  });

  it('logs a failed row when the server rejects', async () => {
    deliver.mockRejectedValue(Object.assign(new Error('bad auth'), { code: 'EAUTH' }));

    const result = await send();

    expect(result.success).toBe(false);
    expect(logEmail).toHaveBeenCalledTimes(1);
    expect(logEmail.mock.calls[0][0]).toMatchObject({ status: 'failed' });
  });
});

describe('bookkeeping can never break a send', () => {
  beforeEach(() => {
    process.env.MAIL_TRANSPORT = 'resend';
    resendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null });
  });

  it('survives a logger that returns nothing instead of a promise', async () => {
    // Not hypothetical: jest's resetMocks produced exactly this, and the un-guarded
    // helper called .catch on undefined, threw inside the send, and reported a
    // successfully delivered email as failed.
    logEmail.mockReturnValue(undefined as unknown as Promise<void>);

    await expect(send()).resolves.toMatchObject({ success: true });
  });

  it('survives a logger that throws synchronously', async () => {
    logEmail.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(send()).resolves.toMatchObject({ success: true });
  });
});

describe('both transports agree', () => {
  it('produce exactly one row per send, never zero and never two', async () => {
    for (const mode of ['resend', 'smtp'] as const) {
      process.env.MAIL_TRANSPORT = mode;
      logEmail.mockClear();
      resendSend.mockResolvedValue({ data: { id: 'x' }, error: null });
      deliver.mockResolvedValue({
        messageId: 'x',
        provider: 'platform_smtp',
        durationMs: 1,
        response: '250 ok',
      });

      await send();

      expect(logEmail).toHaveBeenCalledTimes(1);
    }
  });
});
