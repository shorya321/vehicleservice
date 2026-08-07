/**
 * Tenant mail configuration resolution.
 *
 * The contract under test is the one that keeps this feature from ever losing a
 * customer's booking confirmation: every failure mode degrades to the platform
 * transport, and none of them throws.
 *
 * The case most likely to regress silently is the last one in the fallback block: a
 * fallback must keep the tenant's BRAND even though it loses the tenant's TRANSPORT.
 * Getting that wrong means a white-label customer suddenly sees the platform's name.
 */

const mockMaybeSingle = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mockMaybeSingle }),
      }),
    }),
  }),
}));

import { encryptSecret, resetMailCryptoCache } from '@/lib/email/transport/crypto';
import { clearMailConfigCache, resolveMailConfig } from '@/lib/email/transport/resolve-config';

const KEY = Buffer.alloc(32, 7).toString('base64');
const TENANT = '11111111-1111-4111-8111-111111111111';

const originalEnv = { ...process.env };

const brandColumns = {
  id: TENANT,
  business_name: 'Acme Hotel Group',
  brand_name: 'Acme Transfers',
  logo_url: 'https://cdn.example.com/acme.png',
  business_email: 'support@acmehotel.com',
  address: '1 Marina Walk, Dubai',
  subdomain: 'acme',
  custom_domain: 'transfers.acmehotel.com',
  custom_domain_verified: true,
};

function settingsRow(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    smtp_host: 'smtp.resend.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: 'resend',
    smtp_password_encrypted: encryptSecret('re_secret_key', TENANT),
    from_email: 'bookings@acmehotel.com',
    from_name: 'Acme Transfers',
    reply_to: 'support@acmehotel.com',
    allow_platform_fallback: true,
    consecutive_failures: 0,
    updated_at: '2026-08-07T10:00:00Z',
    ...overrides,
  };
}

function resolvesTo(settings: unknown) {
  mockMaybeSingle.mockResolvedValue({
    data: { ...brandColumns, business_email_settings: settings },
    error: null,
  });
}

beforeEach(() => {
  process.env.EMAIL_ENCRYPTION_KEY = KEY;
  process.env.RESEND_FROM_EMAIL = 'noreply@infiniatransfers.com';
  process.env.RESEND_API_KEY = 'platform-key';
  delete process.env.EMAIL_ENCRYPTION_KEY_VERSION;
  delete process.env.EMAIL_ENCRYPTION_KEYS_RETIRED;

  resetMailCryptoCache();
  clearMailConfigCache();
  mockMaybeSingle.mockReset();
});

afterEach(() => {
  process.env = { ...originalEnv };
  resetMailCryptoCache();
  clearMailConfigCache();
});

describe('platform mail', () => {
  it('short-circuits on a null tenant without touching the database', async () => {
    const config = await resolveMailConfig(null);

    expect(config.provider).toBe('platform_smtp');
    expect(config.businessAccountId).toBeNull();
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it('uses the platform brand', async () => {
    const config = await resolveMailConfig(null);

    expect(config.brand.name).toBe('Infinia Transfers');
    expect(config.brand.showPlatformLinks).toBe(true);
  });
});

describe('a configured tenant', () => {
  it('sends on its own credentials', async () => {
    resolvesTo(settingsRow());

    const config = await resolveMailConfig(TENANT);

    expect(config.provider).toBe('business_smtp');
    expect(config.smtp.host).toBe('smtp.resend.com');
    expect(config.smtp.user).toBe('resend');
    expect(config.smtp.pass).toBe('re_secret_key');
    expect(config.identity.fromEmail).toBe('bookings@acmehotel.com');
  });

  it('carries its own brand, not the platform one', async () => {
    resolvesTo(settingsRow());

    const { brand } = await resolveMailConfig(TENANT);

    expect(brand.name).toBe('Acme Transfers');
    expect(brand.logoUrl).toBe('https://cdn.example.com/acme.png');
    expect(brand.supportEmail).toBe('support@acmehotel.com');
    // Platform legal pages must never appear under a tenant's brand.
    expect(brand.showPlatformLinks).toBe(false);
  });

  it('prefers a verified custom domain for the brand url', async () => {
    resolvesTo(settingsRow());

    expect((await resolveMailConfig(TENANT)).brand.url).toBe('https://transfers.acmehotel.com');
  });

  it('falls back to the subdomain when the custom domain is unverified', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        ...brandColumns,
        custom_domain_verified: false,
        business_email_settings: settingsRow(),
      },
      error: null,
    });

    expect((await resolveMailConfig(TENANT)).brand.url).toContain('//acme.');
  });

  it('keys the transporter on updated_at so a credential edit builds a new one', async () => {
    resolvesTo(settingsRow());
    const first = await resolveMailConfig(TENANT);

    clearMailConfigCache();
    resolvesTo(settingsRow({ updated_at: '2026-08-07T11:00:00Z' }));
    const second = await resolveMailConfig(TENANT);

    expect(first.fingerprint).not.toBe(second.fingerprint);
  });

  it('accepts the embedded row as an array, which is how PostgREST may return it', async () => {
    resolvesTo([settingsRow()]);

    expect((await resolveMailConfig(TENANT)).provider).toBe('business_smtp');
  });
});

describe('falls back to platform transport but keeps the tenant brand', () => {
  const cases: Array<[string, unknown]> = [
    ['no settings row at all', null],
    ['settings switched off', settingsRow({ enabled: false })],
    ['no host', settingsRow({ smtp_host: '' })],
    ['no username', settingsRow({ smtp_username: '' })],
    ['no stored password', settingsRow({ smtp_password_encrypted: '' })],
    ['no from address', settingsRow({ from_email: '' })],
    ['circuit breaker tripped', settingsRow({ consecutive_failures: 3 })],
    ['password encrypted under another key', settingsRow({ smtp_password_encrypted: 'v1:1:AAAA:AAAA:AAAA' })],
  ];

  it.each(cases)('%s', async (_label, settings) => {
    resolvesTo(settings);

    const config = await resolveMailConfig(TENANT);

    expect(config.provider).toBe('platform_smtp');
    // The whole point: transport degrades, identity does not.
    expect(config.brand.name).toBe('Acme Transfers');
    expect(config.brand.showPlatformLinks).toBe(false);
    expect(config.businessAccountId).toBe(TENANT);
  });

  it('stops attempting the tenant transport one failure below the threshold', async () => {
    resolvesTo(settingsRow({ consecutive_failures: 2 }));

    expect((await resolveMailConfig(TENANT)).provider).toBe('business_smtp');
  });

  it('survives a ciphertext belonging to a different tenant', async () => {
    resolvesTo(settingsRow({ smtp_password_encrypted: encryptSecret('re_key', 'another-tenant-id') }));

    const config = await resolveMailConfig(TENANT);

    expect(config.provider).toBe('platform_smtp');
  });

  it('survives a database error without throwing', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'connection reset' } });

    const config = await resolveMailConfig(TENANT);

    expect(config.provider).toBe('platform_smtp');
    expect(config.brand.name).toBe('Infinia Transfers');
  });

  it('survives the query rejecting outright', async () => {
    mockMaybeSingle.mockRejectedValue(new Error('boom'));

    await expect(resolveMailConfig(TENANT)).resolves.toMatchObject({ provider: 'platform_smtp' });
  });

  it('falls back when the encryption key is missing entirely', async () => {
    resolvesTo(settingsRow());
    clearMailConfigCache();
    delete process.env.EMAIL_ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    resetMailCryptoCache();

    expect((await resolveMailConfig(TENANT)).provider).toBe('platform_smtp');
  });
});

/**
 * Regression cover for a deadlock found only by running the feature end to end.
 *
 * The enable switch requires a successful test send, but a test send resolved normally
 * returns the platform transport *because* sending is not enabled yet. A business could
 * therefore never turn the feature on. Unit tests missed it because each half was
 * individually correct.
 */
describe('test-send resolution (ignoreEnabled)', () => {
  it('builds a tenant config even though sending is switched off', async () => {
    resolvesTo(settingsRow({ enabled: false }));

    const config = await resolveMailConfig(TENANT, { ignoreEnabled: true });

    expect(config.provider).toBe('business_smtp');
    expect(config.smtp.host).toBe('smtp.resend.com');
  });

  it('bypasses the circuit breaker, which is how an owner recovers after fixing a password', async () => {
    resolvesTo(settingsRow({ enabled: false, consecutive_failures: 9 }));

    expect((await resolveMailConfig(TENANT, { ignoreEnabled: true })).provider).toBe('business_smtp');
  });

  it('still refuses when the configuration is genuinely unusable', async () => {
    resolvesTo(settingsRow({ enabled: false, smtp_host: '' }));

    expect((await resolveMailConfig(TENANT, { ignoreEnabled: true })).provider).toBe('platform_smtp');
  });

  it('never writes its config to the cache, which would start routing real mail early', async () => {
    resolvesTo(settingsRow({ enabled: false }));

    await resolveMailConfig(TENANT, { ignoreEnabled: true });
    // A normal resolve immediately afterwards must not see the test config.
    const normal = await resolveMailConfig(TENANT);

    expect(normal.provider).toBe('platform_smtp');
  });

  it('never reads a cached config either, so a save moments ago is what gets tested', async () => {
    resolvesTo(settingsRow({ enabled: false }));
    await resolveMailConfig(TENANT); // seeds the cache with a platform config
    mockMaybeSingle.mockClear();

    const config = await resolveMailConfig(TENANT, { ignoreEnabled: true });

    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
    expect(config.provider).toBe('business_smtp');
  });
});

describe('caching', () => {
  it('does not re-query within the ttl', async () => {
    resolvesTo(settingsRow());

    await resolveMailConfig(TENANT);
    await resolveMailConfig(TENANT);

    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
  });

  it('re-queries after the cache is busted', async () => {
    resolvesTo(settingsRow());

    await resolveMailConfig(TENANT);
    clearMailConfigCache();
    await resolveMailConfig(TENANT);

    expect(mockMaybeSingle).toHaveBeenCalledTimes(2);
  });
});
