/**
 * Which bookings currently have a vendor on them.
 *
 * This one predicate now gates three things: cancelling, deleting, and bulk
 * deleting. It is worth its own tests because both directions of a wrong answer
 * are expensive - a false negative lets a business hard-delete a booking a
 * driver is on their way to, and a false positive locks them out of a booking
 * nobody is assigned to.
 *
 * The status set is the load-bearing detail. 'rejected', 'cancelled' and
 * 'completed' assignments are closed: a booking whose only vendor rejected it
 * must be as deletable as one that was never assigned at all.
 */

jest.mock('server-only', () => ({}), { virtual: true });

import {
  ACTIVE_ASSIGNMENT_STATUSES,
  findBookingsWithActiveAssignment,
  hasActiveVendorAssignment,
} from '@/lib/business/bookings/active-assignments';

type Row = { business_booking_id: string | null };

/** Records what was asked, and answers with whatever the test supplies. */
function fakeClient(result: { data: Row[] | null; error: { message: string } | null }) {
  const calls: { table?: string; columns?: string; filters: [string, unknown][] } = {
    filters: [],
  };

  const builder: Record<string, unknown> = {
    select(columns: string) {
      calls.columns = columns;
      return builder;
    },
    in(column: string, values: unknown) {
      calls.filters.push([column, values]);
      return builder;
    },
    then(resolve: (r: typeof result) => unknown) {
      return Promise.resolve(result).then(resolve);
    },
  };

  const client = {
    from(table: string) {
      calls.table = table;
      return builder;
    },
  };

  return { client: client as never, calls };
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the query it actually issues', () => {
  it('asks booking_assignments, never booking_status', async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    await findBookingsWithActiveAssignment(client, ['b1']);

    expect(calls.table).toBe('booking_assignments');
    expect(calls.columns).toBe('business_booking_id');
  });

  it('filters on the booking ids and on the open statuses only', async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    await findBookingsWithActiveAssignment(client, ['b1', 'b2']);

    expect(calls.filters).toEqual([
      ['business_booking_id', ['b1', 'b2']],
      ['status', ['pending', 'accepted']],
    ]);
  });

  it('treats only pending and accepted as active', () => {
    // Array.from, not spread: tsconfig targets es5 without downlevelIteration,
    // where spreading a non-array iterable silently yields an empty array.
    expect(Array.from(ACTIVE_ASSIGNMENT_STATUSES)).toEqual(['pending', 'accepted']);
    for (const closed of ['rejected', 'cancelled', 'completed']) {
      expect(ACTIVE_ASSIGNMENT_STATUSES).not.toContain(closed);
    }
  });

  it('issues no query at all for an empty list', async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    const result = await findBookingsWithActiveAssignment(client, []);

    expect(calls.table).toBeUndefined();
    expect(result.assignedIds.size).toBe(0);
    expect(result.error).toBeNull();
  });
});

describe('reading the answer', () => {
  it('returns only the bookings that came back', async () => {
    const { client } = fakeClient({
      data: [{ business_booking_id: 'b2' }],
      error: null,
    });

    const { assignedIds } = await findBookingsWithActiveAssignment(client, ['b1', 'b2', 'b3']);

    expect(Array.from(assignedIds)).toEqual(['b2']);
  });

  it('collapses two assignment rows for one booking into one id', async () => {
    const { client } = fakeClient({
      data: [{ business_booking_id: 'b1' }, { business_booking_id: 'b1' }],
      error: null,
    });

    const { assignedIds } = await findBookingsWithActiveAssignment(client, ['b1']);

    expect(assignedIds.size).toBe(1);
  });

  it('ignores a null business_booking_id, which is a customer-side assignment', async () => {
    const { client } = fakeClient({
      data: [{ business_booking_id: null }, { business_booking_id: 'b1' }],
      error: null,
    });

    const { assignedIds } = await findBookingsWithActiveAssignment(client, ['b1']);

    expect(Array.from(assignedIds)).toEqual(['b1']);
  });

  it('survives a null data payload', async () => {
    const { client } = fakeClient({ data: null, error: null });
    const { assignedIds, error } = await findBookingsWithActiveAssignment(client, ['b1']);

    expect(assignedIds.size).toBe(0);
    expect(error).toBeNull();
  });
});

describe('failure is reported, never swallowed', () => {
  it('returns the error so callers can refuse rather than assume nobody is assigned', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'connection reset' } });
    const { assignedIds, error } = await findBookingsWithActiveAssignment(client, ['b1']);

    // Empty AND an error. A caller reading only the set would wrongly conclude
    // the booking is free, which is why every call site checks error first.
    expect(assignedIds.size).toBe(0);
    expect(error).toBe('connection reset');
  });
});

describe('the single-booking wrapper', () => {
  it('is true when that booking came back', async () => {
    const { client } = fakeClient({ data: [{ business_booking_id: 'b1' }], error: null });
    expect(await hasActiveVendorAssignment(client, 'b1')).toEqual({ assigned: true, error: null });
  });

  it('is false when nothing came back', async () => {
    const { client } = fakeClient({ data: [], error: null });
    expect(await hasActiveVendorAssignment(client, 'b1')).toEqual({ assigned: false, error: null });
  });

  it('is false but carries the error when the read failed', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'timeout' } });
    expect(await hasActiveVendorAssignment(client, 'b1')).toEqual({
      assigned: false,
      error: 'timeout',
    });
  });
});
