/**
 * Where a business tenant's browser is sent back to after paying.
 *
 * The bug this guards against: the Stripe Checkout success_url and cancel_url were built
 * from NEXT_PUBLIC_SITE_URL, so a tenant who started a wallet top-up on their own custom
 * domain was returned to the platform host. Supabase auth cookies are host-only, so they
 * arrived signed out, proxy.ts bounced them to /business/login, and the session_id that
 * the client-side crediting call needs was lost - money taken, wallet not credited.
 *
 * Two things have to hold at once, and they pull in opposite directions:
 *   - the returned origin must follow the tenant to their own host, and
 *   - a Host or Origin header must never be trusted, because this repo ships to two
 *     hosts and the forwarding headers are spoofable on one of them.
 *
 * The resolution is an allowlist built from the authenticated tenant's own row. These
 * tests pin both halves, and the first case is the no-regression lock on the main-domain
 * flow that already worked.
 */

const PLATFORM = 'https://example.com';

/** jest.config.js sets resetMocks: true, so re-require per test to pick up env changes. */
function loadHelper() {
  let mod: typeof import('@/lib/business/tenant-origin');
  jest.isolateModules(() => {
    mod = require('@/lib/business/tenant-origin');
  });
  return mod!;
}

function requestWith(headers: Record<string, string>): Request {
  return new Request('https://ignored.invalid/api/business/wallet/checkout', {
    method: 'POST',
    headers,
  });
}

const VERIFIED_CUSTOM = {
  subdomain: 'vrooem',
  customDomain: 'vendor.example.com',
  customDomainVerified: true,
};

const SUBDOMAIN_ONLY = {
  subdomain: 'vrooem',
  customDomain: null,
  customDomainVerified: null,
};

describe('resolveTenantOrigin', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = PLATFORM;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('returns the platform origin for a request on the platform host', () => {
    // The no-regression lock: this is the flow that already worked, and the resulting
    // URL has to stay byte-identical to the old `${NEXT_PUBLIC_SITE_URL}` prefix.
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(requestWith({ host: 'example.com' }), VERIFIED_CUSTOM)
    ).toBe('https://example.com');
  });

  it('returns the tenant custom domain when the browser reports it', () => {
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ host: 'example.com' }),
        VERIFIED_CUSTOM,
        'https://vendor.example.com'
      )
    ).toBe('https://vendor.example.com');
  });

  it('ignores an unverified custom domain', () => {
    // get_business_by_custom_domain filters on custom_domain_verified, so proxy.ts will
    // not serve the portal there. Returning a payer to it would strand them.
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ host: 'example.com' }),
        { ...VERIFIED_CUSTOM, customDomainVerified: false },
        'https://vendor.example.com'
      )
    ).toBe('https://example.com');
  });

  it('falls back to the Origin header when the client sends no origin', () => {
    // A tab still running a pre-deploy bundle posts no `origin` field. The header keeps
    // that case correct instead of silently reintroducing the bug.
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ origin: 'https://vendor.example.com', host: 'vendor.example.com' }),
        VERIFIED_CUSTOM
      )
    ).toBe('https://vendor.example.com');
  });

  it('resolves a subdomain-only tenant to its subdomain', () => {
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ host: 'example.com' }),
        SUBDOMAIN_ONLY,
        'https://vrooem.example.com'
      )
    ).toBe('https://vrooem.example.com');
  });

  it('rejects a forged host', () => {
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ host: 'evil.com', 'x-forwarded-host': 'evil.com' }),
        VERIFIED_CUSTOM,
        'https://evil.com'
      )
    ).toBe('https://example.com');
  });

  it('rejects another tenant\'s verified domain', () => {
    // The allowlist is built from this business's own row, so cross-tenant isolation is
    // structural rather than a check someone has to remember to write.
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ host: 'example.com' }),
        VERIFIED_CUSTOM,
        'https://other-tenant.example.com'
      )
    ).toBe('https://example.com');
  });

  it.each([
    ['javascript:alert(1)', 'a non-http scheme'],
    ['//evil.com', 'a protocol-relative URL'],
    ['', 'an empty string'],
  ])('rejects %s (%s)', (candidate) => {
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(requestWith({ host: 'example.com' }), VERIFIED_CUSTOM, candidate)
    ).toBe('https://example.com');
  });

  it('keeps the http scheme and the port on a localhost subdomain', () => {
    // vrooem.localhost:3001 is a real dev host, and it does not start with "localhost" -
    // a prefix check here would hand Stripe an https URL against the dev server.
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3001';
    const { resolveTenantOrigin } = loadHelper();

    expect(
      resolveTenantOrigin(
        requestWith({ host: 'localhost:3001' }),
        SUBDOMAIN_ONLY,
        'http://vrooem.localhost:3001'
      )
    ).toBe('http://vrooem.localhost:3001');
  });

  it('never yields the string "undefined" when NEXT_PUBLIC_SITE_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { resolveTenantOrigin } = loadHelper();

    const resolved = resolveTenantOrigin(
      requestWith({ host: 'example.com' }),
      VERIFIED_CUSTOM
    );

    expect(resolved).not.toContain('undefined');
    expect(resolved).toMatch(/^https?:\/\//);
  });
});

describe('tenantOriginAllowlist', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = PLATFORM;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('always includes the platform host, so a tenant can sign in there', () => {
    const { tenantOriginAllowlist } = loadHelper();

    expect(Array.from(tenantOriginAllowlist(VERIFIED_CUSTOM).keys())).toEqual(
      expect.arrayContaining(['example.com', 'vrooem.example.com', 'vendor.example.com'])
    );
  });

  it('lowercases hosts so casing cannot defeat the match', () => {
    const { tenantOriginAllowlist } = loadHelper();

    expect(
      tenantOriginAllowlist({ ...VERIFIED_CUSTOM, customDomain: 'VENDOR.Example.COM' })
    ).toHaveProperty('size');
    expect(
      Array.from(tenantOriginAllowlist({ ...VERIFIED_CUSTOM, customDomain: 'VENDOR.Example.COM' }).keys())
    ).toContain('vendor.example.com');
  });
});
