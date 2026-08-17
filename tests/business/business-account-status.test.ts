/**
 * Approving a business must always tell the business.
 *
 * The bug this guards against: two admin surfaces, only one of which emailed the
 * owner. The list-page server action flipped the status and told nobody, and since
 * the activity feed is written by a database trigger it looked healthy the whole
 * time. These tests pin the contract of the shared helper both surfaces now use.
 */

const approvalMock = jest.fn();
const rejectionMock = jest.fn();

// What the mocked query builder hands back. Set per test.
const state: {
  claimed: { data: Record<string, unknown> | null; error: unknown };
  current: { data: Record<string, unknown> | null };
  owner: { data: Record<string, unknown> | null };
} = {
  claimed: { data: null, error: null },
  current: { data: null },
  owner: { data: null },
};

/**
 * A builder thin enough to be obvious: every chained call returns itself, and only
 * the terminal maybeSingle() decides what comes back - from the table, and from
 * whether an update() was in the chain.
 */
function mockBuildQuery(table: string) {
  let isUpdate = false;

  const builder: Record<string, unknown> = {
    update: () => {
      isUpdate = true;
      return builder;
    },
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => {
      if (table === 'business_users') return state.owner;
      return isUpdate ? state.claimed : state.current;
    },
  };

  return builder;
}

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (table: string) => mockBuildQuery(table) }),
}));

jest.mock('@/lib/business/email/services/business-emails', () => ({
  sendBusinessApprovalEmail: (...args: unknown[]) => approvalMock(...args),
  sendBusinessRejectionEmail: (...args: unknown[]) => rejectionMock(...args),
}));

import {
  approveBusinessAccount,
  rejectBusinessAccount,
} from '@/lib/business/admin/account-status';

const BUSINESS_ID = '33333333-3333-3333-3333-333333333333';

const CLAIMED = {
  business_name: 'Burj Khalifa Transfers',
  business_email: 'owner@burjkhalifa.example',
  contact_person_name: 'Vikas Kaundal',
};

describe('approveBusinessAccount', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    state.claimed = { data: { ...CLAIMED }, error: null };
    state.current = { data: null };
    state.owner = { data: null };
    approvalMock.mockResolvedValue({ success: true, emailId: 'em_1' });
    rejectionMock.mockResolvedValue({ success: true, emailId: 'em_2' });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_SITE_URL = 'https://infiniatransfers.example';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('emails the business address with a platform login link', async () => {
    const result = await approveBusinessAccount(BUSINESS_ID);

    expect(result).toEqual({
      success: true,
      businessName: 'Burj Khalifa Transfers',
      emailDelivered: true,
    });
    expect(approvalMock).toHaveBeenCalledTimes(1);
    expect(approvalMock).toHaveBeenCalledWith({
      email: 'owner@burjkhalifa.example',
      businessName: 'Burj Khalifa Transfers',
      ownerName: 'Vikas Kaundal',
      loginUrl: 'https://infiniatransfers.example/business/login',
    });
  });

  it('prefers the business_users name when that row actually has one', async () => {
    state.owner = { data: { full_name: 'Sarah Khan' } };

    await approveBusinessAccount(BUSINESS_ID);

    expect(approvalMock.mock.calls[0][0].ownerName).toBe('Sarah Khan');
  });

  it('falls back to contact_person_name rather than greeting a person as "Business Owner"', async () => {
    // Signup left business_users.full_name NULL for every owner created before the
    // insert was fixed, which is exactly when this fallback has to work.
    state.owner = { data: { full_name: null } };

    await approveBusinessAccount(BUSINESS_ID);

    expect(approvalMock.mock.calls[0][0].ownerName).toBe('Vikas Kaundal');
  });

  it('uses the placeholder only when there is no name anywhere', async () => {
    state.claimed = { data: { ...CLAIMED, contact_person_name: null }, error: null };

    await approveBusinessAccount(BUSINESS_ID);

    expect(approvalMock.mock.calls[0][0].ownerName).toBe('Business Owner');
  });

  it('refuses an account that is no longer pending and sends nothing', async () => {
    state.claimed = { data: null, error: null };
    state.current = { data: { status: 'active' } };

    const result = await approveBusinessAccount(BUSINESS_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain("status 'active'");
    expect(approvalMock).not.toHaveBeenCalled();
  });

  it('spells the refusal in real English, since an admin reads it', async () => {
    state.claimed = { data: null, error: null };
    state.current = { data: { status: 'active' } };

    const result = await approveBusinessAccount(BUSINESS_ID);

    expect(result.error).toBe(
      "Cannot approve business with status 'active'. Only pending businesses can be approved."
    );
    expect(result.error).not.toContain('approveed');
  });

  it('reports a missing account distinctly from an already-decided one', async () => {
    state.claimed = { data: null, error: null };
    state.current = { data: null };

    const result = await approveBusinessAccount(BUSINESS_ID);

    expect(result).toEqual({ success: false, error: 'Business account not found' });
    expect(approvalMock).not.toHaveBeenCalled();
  });

  it('keeps the approval when the email fails, and says the owner was not reached', async () => {
    approvalMock.mockResolvedValue({ success: false, error: 'RESEND_API_KEY is not set' });

    const result = await approveBusinessAccount(BUSINESS_ID);

    expect(result.success).toBe(true);
    expect(result.emailDelivered).toBe(false);
  });
});

describe('rejectBusinessAccount', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    state.claimed = { data: { ...CLAIMED }, error: null };
    state.current = { data: null };
    state.owner = { data: null };
    approvalMock.mockResolvedValue({ success: true });
    rejectionMock.mockResolvedValue({ success: true });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('passes the reason through and leaves supportEmail to the template default', async () => {
    // The old call site hardcoded support@vehicleservice.com, a domain this product
    // does not own. Passing nothing is what makes the template's own default win.
    const result = await rejectBusinessAccount(BUSINESS_ID, 'Trade licence could not be verified');

    expect(result.success).toBe(true);
    expect(rejectionMock).toHaveBeenCalledWith({
      email: 'owner@burjkhalifa.example',
      businessName: 'Burj Khalifa Transfers',
      ownerName: 'Vikas Kaundal',
      reason: 'Trade licence could not be verified',
    });
    expect(rejectionMock.mock.calls[0][0]).not.toHaveProperty('supportEmail');
  });

  it('refuses a non-pending account and sends nothing', async () => {
    state.claimed = { data: null, error: null };
    state.current = { data: { status: 'rejected' } };

    const result = await rejectBusinessAccount(BUSINESS_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Cannot reject business with status 'rejected'. Only pending businesses can be rejected."
    );
    expect(result.error).not.toContain('rejecteed');
    expect(rejectionMock).not.toHaveBeenCalled();
  });
});
