/**
 * The writer's contract is that it never throws and never writes noise.
 * Both matter more than the happy path: a logging failure must not be able to
 * abort a booking, and a no-op save must not produce a row.
 */

const rpcMock = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}));

import { logBusinessActivity, activityLogger, diffRecords } from '@/lib/business/activity/log';

const ACCOUNT = '22222222-2222-2222-2222-222222222222';

describe('logBusinessActivity', () => {
  const originalEnv = { ...process.env };
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = { ...originalEnv };
  });

  const actor = { type: 'business_user' as const, name: 'Sarah Khan' };

  it('writes a row with category and severity taken from the catalog, not the caller', async () => {
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'booking.deleted',
      actor,
      entity: { id: 'b1', label: 'BK-2026-0031' },
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [name, args] = rpcMock.mock.calls[0];
    expect(name).toBe('log_business_activity');
    expect(args.p_category).toBe('booking');
    expect(args.p_severity).toBe('critical');
    expect(args.p_entity_type).toBe('business_booking');
    expect(args.p_entity_label).toBe('BK-2026-0031');
  });

  it('suppresses the row entirely when nothing actually changed', async () => {
    // Opening a settings form and pressing Save without touching anything.
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'settings.brand_name_changed',
      actor,
      changes: { brand_name: { from: 'Acme', to: 'Acme' } },
    });

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('writes only the fields that genuinely changed', async () => {
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'settings.company_profile_updated',
      actor,
      changes: {
        business_name: { from: 'Acme', to: 'Acme Travel' },
        city: { from: 'Dubai', to: 'Dubai' },
      },
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const changes = rpcMock.mock.calls[0][1].p_changes;
    expect(Object.keys(changes)).toEqual(['business_name']);
  });

  it('redacts secret shaped keys but keeps the field name visible', async () => {
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'settings.domain_added',
      actor,
      metadata: {
        domain: 'travel.acme.com',
        domain_verification_token: 'super-secret-value',
        stripe_client_secret: 'pi_123_secret_456',
      },
    });

    const metadata = rpcMock.mock.calls[0][1].p_metadata;
    expect(metadata.domain).toBe('travel.acme.com');
    expect(metadata.domain_verification_token).toBe('[redacted]');
    expect(metadata.stripe_client_secret).toBe('[redacted]');
  });

  it('redacts secret shaped fields inside a diff', async () => {
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'settings.payment_settings_updated',
      actor,
      changes: { api_key: { from: 'old-key', to: 'new-key' } },
    });

    const changes = rpcMock.mock.calls[0][1].p_changes;
    expect(changes.api_key).toEqual({ from: '[redacted]', to: '[redacted]' });
  });

  it('caps oversized metadata instead of writing an unbounded blob', async () => {
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'booking.bulk_deleted',
      actor,
      metadata: {
        count: 5000,
        refs: Array.from({ length: 5000 }, (_, index) => `BK-2026-${index}`),
      },
    });

    const metadata = rpcMock.mock.calls[0][1].p_metadata;
    expect(metadata.truncated).toBe(true);
    expect(metadata.refs).toBeUndefined();
    expect(metadata.count).toBe(5000);
    expect(JSON.stringify(metadata).length).toBeLessThanOrEqual(4096);
  });

  it('does not throw when the RPC returns an error', async () => {
    rpcMock.mockResolvedValue({ error: { message: 'boom' } });

    await expect(
      logBusinessActivity({ businessAccountId: ACCOUNT, action: 'booking.created', actor })
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('does not throw when the RPC rejects outright', async () => {
    rpcMock.mockRejectedValue(new Error('network down'));

    await expect(
      logBusinessActivity({ businessAccountId: ACCOUNT, action: 'booking.created', actor })
    ).resolves.toBeUndefined();
  });

  it('skips the write when the service role key is absent, without throwing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await expect(
      logBusinessActivity({ businessAccountId: ACCOUNT, action: 'booking.created', actor })
    ).resolves.toBeUndefined();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('ignores a call with no tenant', async () => {
    await logBusinessActivity({
      businessAccountId: '',
      action: 'booking.created',
      actor,
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('reads the client ip from the first hop of x-forwarded-for', async () => {
    const request = new Request('https://example.com/api/business/team', {
      headers: {
        'x-forwarded-for': '203.0.113.9, 70.41.3.18, 150.172.238.178',
        'user-agent': 'Mozilla/5.0 (probe)',
      },
    });

    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'security.login_succeeded',
      actor,
      request,
    });

    const args = rpcMock.mock.calls[0][1];
    expect(args.p_ip_address).toBe('203.0.113.9');
    expect(args.p_user_agent).toBe('Mozilla/5.0 (probe)');
  });

  it('omits request context for background callers', async () => {
    await logBusinessActivity({
      businessAccountId: ACCOUNT,
      action: 'wallet.topup_succeeded',
      actor: { type: 'system', name: 'Stripe' },
      skipRequestContext: true,
    });

    const args = rpcMock.mock.calls[0][1];
    expect(args.p_ip_address).toBeUndefined();
    expect(args.p_user_agent).toBeUndefined();
  });
});

describe('activityLogger', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  });

  it('pre-binds the tenant and actor so a call site is one line', async () => {
    const log = activityLogger({
      businessAccountId: ACCOUNT,
      userId: 'auth-1',
      businessId: 'bu-1',
      role: 'owner',
      memberName: 'Sarah Khan',
      memberEmail: 'sarah@acme.com',
    });

    await log('team.member_removed', { entity: { id: 'bu-2', label: 'ali@acme.com' } });

    const args = rpcMock.mock.calls[0][1];
    expect(args.p_business_account_id).toBe(ACCOUNT);
    expect(args.p_actor_name).toBe('Sarah Khan');
    expect(args.p_actor_business_user_id).toBe('bu-1');
    expect(args.p_actor_role).toBe('owner');
    expect(args.p_severity).toBe('critical');
  });

  it('falls back to the email when no name is known', async () => {
    const log = activityLogger({
      businessAccountId: ACCOUNT,
      memberName: null,
      memberEmail: 'ali@acme.com',
    });
    await log('booking.created');
    expect(rpcMock.mock.calls[0][1].p_actor_name).toBe('ali@acme.com');
  });

  it('sends no name at all when nothing is known, so the RPC resolves it', async () => {
    // business_users.full_name and .email are null on accounts created before
    // 20260720_business_staff_users.sql. Passing a generic placeholder here
    // would pre-empt the RPC's business_users -> profiles fallback and bury a
    // real name the database could have supplied.
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });
    const anonymous = activityLogger({ businessAccountId: ACCOUNT, userId: 'auth-1' });
    await anonymous('booking.created');

    const args = rpcMock.mock.calls[0][1];
    expect(args.p_actor_name).toBeUndefined();
    expect(args.p_actor_auth_user_id).toBe('auth-1');
  });

  it('lets a call site override the actor for a non-member action', async () => {
    const log = activityLogger({ businessAccountId: ACCOUNT, memberName: 'Sarah Khan' });
    await log('wallet.topup_succeeded', {
      actor: { type: 'system', name: 'Stripe' },
    });

    const args = rpcMock.mock.calls[0][1];
    expect(args.p_actor_type).toBe('system');
    expect(args.p_actor_name).toBe('Stripe');
  });
});

describe('diffRecords', () => {
  it('reports only genuinely changed fields', () => {
    const changes = diffRecords(
      { brand_name: 'Acme', city: 'Dubai', logo_url: null },
      { brand_name: 'Acme Travel', city: 'Dubai', logo_url: null }
    );
    expect(Object.keys(changes)).toEqual(['brand_name']);
    expect(changes.brand_name).toEqual({ from: 'Acme', to: 'Acme Travel' });
  });

  it('treats undefined and null as the same absent value', () => {
    expect(diffRecords({ a: undefined }, { a: null })).toEqual({});
  });

  it('returns an empty object when nothing moved', () => {
    expect(diffRecords({ a: 1 }, { a: 1 })).toEqual({});
  });
});
