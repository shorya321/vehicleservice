/**
 * Email footers take the office address and company line from Settings > General.
 *
 * Guards three things: platform mail shows the real address (the old footer printed a
 * made-up "123 Business Bay" street), a tenant's mail never names the platform's
 * company, and a settings failure never stops the email going out.
 */

// Implementations are (re)installed in beforeEach: jest.config.js sets resetMocks: true.
const logEmail = jest.fn();
const resendSend = jest.fn();
const getSiteSettings = jest.fn();

jest.mock('@/lib/email/utils/email-log', () => ({ logEmail }));

jest.mock('@/lib/email/config', () => ({
  ...jest.requireActual('@/lib/email/config'),
  getResendClient: () => ({ emails: { send: resendSend } }),
  getEmailConfig: () => ({ from: 'noreply@platform.test', replyTo: 'support@platform.test' }),
}));

jest.mock('@/lib/site-settings/server', () => ({ getSiteSettings }));

import { sendEmail, sendEmailWithConfig } from '@/lib/email/utils/send-email';
import { clearMailConfigCache } from '@/lib/email/transport/resolve-config';
import { getPlatformMailConfig } from '@/lib/email/transport/platform-config';
import { getPlatformBrand } from '@/lib/email/brand/brand';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types';
import type { ResolvedMailConfig } from '@/lib/email/transport/types';
import BusinessWelcomePendingEmail from '@/lib/business/email/templates/welcome-pending';

const originalEnv = { ...process.env };

const SETTINGS = {
  ...DEFAULT_SITE_SETTINGS,
  office_address: 'Aspin Commercial Tower, Dubai',
  legal_name: 'Example Transfers LLC',
  trade_licence_number: '123456',
  licence_issuer: 'Dubai DET',
};

const LEGAL_LINE = 'Operated by Example Transfers LLC, trade licence 123456, issued by Dubai DET';

const params = {
  kind: 'platform.welcome',
  to: 'owner@acmehotel.com',
  subject: 'Welcome',
  template: BusinessWelcomePendingEmail,
  templateProps: { businessName: 'Acme', ownerName: 'Dana', supportEmail: 's@acme.test' },
};

function sentText(): string {
  expect(resendSend).toHaveBeenCalledTimes(1);
  return resendSend.mock.calls[0][0].text as string;
}

function tenantConfig(address: string): ResolvedMailConfig {
  return {
    ...getPlatformMailConfig(),
    businessAccountId: 'tenant-1',
    brand: { ...getPlatformBrand(), name: 'Acme Hotel', address, showPlatformLinks: false },
  };
}

beforeEach(() => {
  process.env.RESEND_FROM_EMAIL = 'noreply@platform.test';
  process.env.RESEND_API_KEY = 'test';
  process.env.MAIL_TRANSPORT = 'resend';
  clearMailConfigCache();
  logEmail.mockReset().mockResolvedValue(undefined);
  resendSend.mockReset().mockResolvedValue({ data: { id: 'resend-1' }, error: null });
  getSiteSettings.mockReset().mockResolvedValue(SETTINGS);
});

afterEach(() => {
  process.env = { ...originalEnv };
  clearMailConfigCache();
});

describe('platform mail', () => {
  it('shows the office address and company line from Settings', async () => {
    await expect(sendEmail({ ...params, businessAccountId: null })).resolves.toMatchObject({ success: true });

    const text = sentText();
    expect(text).toContain('Aspin Commercial Tower, Dubai');
    expect(text).toContain(LEGAL_LINE);
    expect(text).not.toContain('123 Business Bay');
  });

  it('shows no company line while the legal details are empty', async () => {
    getSiteSettings.mockResolvedValue({ ...SETTINGS, legal_name: '', trade_licence_number: '' });

    await sendEmail({ ...params, businessAccountId: null });

    const text = sentText();
    expect(text).toContain('Aspin Commercial Tower, Dubai');
    expect(text).not.toContain('Operated by');
    expect(text).not.toContain('Trade licence');
  });

  it('still sends, with no address line, when Settings cannot be read', async () => {
    getSiteSettings.mockRejectedValue(new Error('database unreachable'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(sendEmail({ ...params, businessAccountId: null })).resolves.toMatchObject({ success: true });

    const text = sentText();
    expect(text).not.toContain('Aspin');
    expect(text).not.toContain('123 Business Bay');
    expect(text).toContain('Infinia Transfers');
    errorSpy.mockRestore();
  });
});

describe('tenant mail', () => {
  it('keeps the tenant address and never shows the platform company line', async () => {
    await sendEmailWithConfig({ ...params, businessAccountId: 'tenant-1' }, tenantConfig('1 Hotel Road, Dubai'));

    const text = sentText();
    expect(text).toContain('1 Hotel Road, Dubai');
    expect(text).not.toContain('Aspin Commercial Tower');
    expect(text).not.toContain('Example Transfers LLC');
    expect(getSiteSettings).not.toHaveBeenCalled();
  });

  it('borrows only the platform postal address when the tenant has none', async () => {
    await sendEmailWithConfig({ ...params, businessAccountId: 'tenant-1' }, tenantConfig(''));

    const text = sentText();
    expect(text).toContain('Aspin Commercial Tower, Dubai');
    expect(text).not.toContain('Example Transfers LLC');
    expect(text).not.toContain('Operated by');
  });
});
