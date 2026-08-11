/**
 * Owner notifications: platform credentials, tenant livery.
 *
 * Two separate failures are guarded here.
 *
 * The first is the routing itself. A business owner must keep hearing about their own
 * bookings when their SMTP server is down, which means the notification cannot travel
 * over that server. But it must still look like their business, so the transport falls
 * back without the brand falling back with it.
 *
 * The second is subtler and was live in the codebase: MAIL_TRANSPORT defaults to
 * 'resend', and the Resend path passed `react:` to the SDK, which renders the HTML
 * itself. Wrapping only our own render() left the SDK's render outside the
 * AsyncLocalStorage scope, so the plain-text part was branded and the HTML was not.
 * Owner notifications would have arrived looking like platform mail while every test
 * that used MAIL_TRANSPORT=smtp passed.
 */

const mockMaybeSingle = jest.fn();
const resendSend = jest.fn();

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

jest.mock('@/lib/email/config', () => ({
  ...jest.requireActual('@/lib/email/config'),
  getResendClient: () => ({ emails: { send: resendSend } }),
  getEmailConfig: () => ({ from: 'noreply@platform.test', replyTo: 'support@platform.test' }),
}));

import { sendEmail } from '@/lib/email/utils/send-email';
import { getCurrentBrand } from '@/lib/email/brand/brand';
import { encryptSecret, resetMailCryptoCache } from '@/lib/email/transport/crypto';
import { clearMailConfigCache, resolveMailConfig } from '@/lib/email/transport/resolve-config';
import { buildBusinessBrand, type BusinessBrandRow } from '@/lib/email/transport/business-brand';
import BusinessWelcomePendingEmail from '@/lib/business/email/templates/welcome-pending';

const TENANT = '22222222-2222-4222-8222-222222222222';
const KEY = Buffer.alloc(32, 7).toString('base64');
const originalEnv = { ...process.env };

const THEME = {
  accent: { primary: '#BA955E', secondary: '#14B8A6', tertiary: '#06B6D4' },
  light: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    sidebar: '#FFFFFF',
    muted: '#F4F4F5',
    text_primary: '#09090B',
    text_secondary: '#71717A',
    border: '#E4E4E7',
  },
};

function row(overrides: Record<string, unknown> = {}) {
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
      theme_config: THEME,
      business_email_settings: {
        enabled: true,
        smtp_host: 'smtp.acme.test',
        smtp_port: 587,
        smtp_secure: false,
        smtp_username: 'acme',
        smtp_password_encrypted: encryptSecret('tenant-secret', TENANT),
        from_email: 'bookings@acmehotel.com',
        from_name: 'Acme Transfers',
        reply_to: null,
        allow_platform_fallback: true,
        consecutive_failures: 0,
        updated_at: '2026-08-10T10:00:00Z',
      },
      ...overrides,
    },
    error: null,
  };
}

beforeEach(() => {
  process.env.EMAIL_ENCRYPTION_KEY = KEY;
  process.env.RESEND_FROM_EMAIL = 'noreply@infiniatransfers.com';
  process.env.PLATFORM_SMTP_PASS = 'platform-key';
  delete process.env.EMAIL_ENCRYPTION_KEY_VERSION;
  delete process.env.EMAIL_ENCRYPTION_KEYS_RETIRED;
  delete process.env.MAIL_TRANSPORT;

  resetMailCryptoCache();
  clearMailConfigCache();
  mockMaybeSingle.mockReset();
  resendSend.mockReset();
  // Built after the key is in place: the fixture encrypts a real credential so the
  // passenger path can actually decrypt one.
  mockMaybeSingle.mockResolvedValue(row());
  resendSend.mockResolvedValue({ data: { id: 'resend-1' }, error: null });
});

afterEach(() => {
  clearMailConfigCache();
  resetMailCryptoCache();
  process.env = { ...originalEnv };
});

describe('forcePlatformTransport', () => {
  it('sends on platform credentials', async () => {
    const config = await resolveMailConfig(TENANT, { forcePlatformTransport: true });

    expect(config.provider).toBe('platform_smtp');
  });

  it('keeps the tenant brand rather than falling back to the platform one', async () => {
    const config = await resolveMailConfig(TENANT, { forcePlatformTransport: true });

    expect(config.brand.name).toBe('Acme Transfers');
    expect(config.brand.showPlatformLinks).toBe(false);
    expect(config.brand.colors.primary).toBe('#BA955E');
  });

  it('puts the tenant name on the From header over the platform address', async () => {
    const config = await resolveMailConfig(TENANT, { forcePlatformTransport: true });

    expect(config.identity.fromName).toBe('Acme Transfers');
    expect(config.identity.fromEmail).toBe('noreply@infiniatransfers.com');
  });

  it('never consults the tenant credentials, even when they are configured and healthy', async () => {
    // The row above has enabled: true and a healthy failure count, so a tenant transport
    // is available. Owner mail must decline it anyway.
    const config = await resolveMailConfig(TENANT, { forcePlatformTransport: true });

    expect(config.smtp.host).not.toBe('smtp.acme.test');
  });

  it('does not leak into the passenger resolution through a shared cache slot', async () => {
    // Order matters: the owner resolution runs first and must not be handed back to the
    // passenger resolution that follows it.
    const owner = await resolveMailConfig(TENANT, { forcePlatformTransport: true });
    const passenger = await resolveMailConfig(TENANT);

    expect(owner.provider).toBe('platform_smtp');
    expect(passenger.provider).toBe('business_smtp');
    expect(passenger.smtp.host).toBe('smtp.acme.test');
  });

  it('does not leak in the other direction either', async () => {
    const passenger = await resolveMailConfig(TENANT);
    const owner = await resolveMailConfig(TENANT, { forcePlatformTransport: true });

    expect(passenger.provider).toBe('business_smtp');
    expect(owner.provider).toBe('platform_smtp');
  });
});

describe('the Resend path', () => {
  it('renders the SDK html inside the brand scope', async () => {
    // Stands in for the SDK: resend.emails.send() renders `react` internally, so whatever
    // getCurrentBrand() returns at this point is what the recipient's HTML will carry.
    let brandDuringSdkRender = '';
    resendSend.mockImplementation(() => {
      brandDuringSdkRender = getCurrentBrand().name;
      return Promise.resolve({ data: { id: 'resend-1' }, error: null });
    });

    await sendEmail({
      businessAccountId: TENANT,
      forcePlatformTransport: true,
      to: 'owner@acmehotel.com',
      subject: 'Booking created',
      template: BusinessWelcomePendingEmail,
      templateProps: { businessName: 'Acme Hotel Group', contactName: 'Sarah' },
    });

    expect(brandDuringSdkRender).toBe('Acme Transfers');
  });

  it('leaves platform mail on the platform brand', async () => {
    let brandDuringSdkRender = '';
    resendSend.mockImplementation(() => {
      brandDuringSdkRender = getCurrentBrand().name;
      return Promise.resolve({ data: { id: 'resend-1' }, error: null });
    });

    await sendEmail({
      businessAccountId: null,
      to: 'someone@example.com',
      subject: 'Platform mail',
      template: BusinessWelcomePendingEmail,
      templateProps: { businessName: 'Acme Hotel Group', contactName: 'Sarah' },
    });

    expect(brandDuringSdkRender).toBe('Infinia Transfers');
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });
});

describe('brand colours', () => {
  function brandFor(theme: unknown): BusinessBrandRow {
    return {
      business_name: 'Acme',
      brand_name: 'Acme',
      logo_url: null,
      business_email: null,
      address: null,
      subdomain: 'acme',
      custom_domain: null,
      custom_domain_verified: false,
      theme_config: theme,
    };
  }

  it('maps the tenant accent onto the primary colour', () => {
    expect(buildBusinessBrand(brandFor(THEME)).colors.primary).toBe('#BA955E');
  });

  it('keeps the message card lighter than the page behind it', () => {
    const { colors } = buildBusinessBrand(brandFor(THEME));

    // light.surface behind, light.card on top. Taking light.background for the page
    // would invert this for the default theme.
    expect(colors.background).toBe('#FAFAFA');
    expect(colors.surface).toBe('#FFFFFF');
  });

  it('picks readable label text on a dark accent', () => {
    expect(buildBusinessBrand(brandFor(THEME)).colors.primaryText).toBe('#ffffff');
  });

  it('flips the label to dark on a pale accent', () => {
    const pale = { ...THEME, accent: { ...THEME.accent, primary: '#FFF8E1' } };

    expect(buildBusinessBrand(brandFor(pale)).colors.primaryText).toBe('#1a1a1a');
  });

  it('falls back to the platform palette when theme_config is absent', () => {
    expect(buildBusinessBrand(brandFor(null)).colors.primary).toBe('#556cd6');
  });

  it('rejects anything that is not a plain hex, rather than emitting it into a style', () => {
    const hostile = {
      accent: { primary: 'red; background: url(http://evil.test)' },
      light: { text_primary: 'javascript:alert(1)' },
    };
    const { colors } = buildBusinessBrand(brandFor(hostile));

    expect(colors.primary).toBe('#556cd6');
    expect(colors.heading).toBe('#1a1a1a');
  });
});
