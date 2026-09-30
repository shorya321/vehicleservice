import {
  groupQuotationBookings,
  type QuotationBookingLink,
} from '@/lib/business/bookings/group-quotation-bookings';

interface Row {
  id: string;
  pickup_datetime: string;
}

const row = (id: string, pickup = '2026-10-01T08:00:00Z'): Row => ({ id, pickup_datetime: pickup });

const link = (
  bookingId: string,
  quotationId: string,
  sortOrder: number,
  quotationNumber = `Q-${quotationId}`
): QuotationBookingLink => ({ bookingId, quotationId, quotationNumber, sortOrder });

describe('groupQuotationBookings', () => {
  it('returns every row as a single entry, in order, when there are no links', () => {
    const rows = [row('a'), row('b'), row('c')];
    const entries = groupQuotationBookings(rows, []);

    expect(entries).toEqual([
      { kind: 'single', booking: rows[0] },
      { kind: 'single', booking: rows[1] },
      { kind: 'single', booking: rows[2] },
    ]);
  });

  it('folds a multi-trip quotation into one group at the position of its first row', () => {
    const rows = [row('x'), row('t2'), row('t1'), row('y')];
    const links = [link('t1', 'q1', 0), link('t2', 'q1', 1)];

    const entries = groupQuotationBookings(rows, links);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({ kind: 'single', booking: rows[0] });
    expect(entries[1]).toEqual({
      kind: 'quotation',
      quotationId: 'q1',
      quotationNumber: 'Q-q1',
      bookings: [rows[2], rows[1]],
      totalTrips: 2,
    });
    expect(entries[2]).toEqual({ kind: 'single', booking: rows[3] });
  });

  it('orders trips by sort_order, then by pickup time', () => {
    const rows = [
      row('late', '2026-10-03T08:00:00Z'),
      row('early', '2026-10-01T08:00:00Z'),
      row('first', '2026-10-05T08:00:00Z'),
    ];
    const links = [link('late', 'q1', 1), link('early', 'q1', 1), link('first', 'q1', 0)];

    const [entry] = groupQuotationBookings(rows, links);

    expect(entry.kind).toBe('quotation');
    if (entry.kind !== 'quotation') return;
    expect(entry.bookings.map((b) => b.id)).toEqual(['first', 'early', 'late']);
  });

  it('keeps a one-trip quotation as a plain row', () => {
    const rows = [row('solo'), row('other')];
    const entries = groupQuotationBookings(rows, [link('solo', 'q1', 0)]);

    expect(entries).toEqual([
      { kind: 'single', booking: rows[0] },
      { kind: 'single', booking: rows[1] },
    ]);
  });

  it('shows a partial group when a filter hides some of its trips', () => {
    const rows = [row('t1'), row('t3')];
    const links = [link('t1', 'q1', 0), link('t2', 'q1', 1), link('t3', 'q1', 2)];

    const [entry] = groupQuotationBookings(rows, links);

    expect(entry).toMatchObject({ kind: 'quotation', totalTrips: 3 });
    if (entry.kind !== 'quotation') return;
    expect(entry.bookings.map((b) => b.id)).toEqual(['t1', 't3']);
  });

  it('shows a lone visible trip of a larger quotation as a plain row', () => {
    const rows = [row('t2')];
    const links = [link('t1', 'q1', 0), link('t2', 'q1', 1)];

    expect(groupQuotationBookings(rows, links)).toEqual([{ kind: 'single', booking: rows[0] }]);
  });

  it('keeps separate quotations in separate groups', () => {
    const rows = [row('a1'), row('b1'), row('a2'), row('b2')];
    const links = [link('a1', 'qa', 0), link('a2', 'qa', 1), link('b1', 'qb', 0), link('b2', 'qb', 1)];

    const entries = groupQuotationBookings(rows, links);

    expect(entries.map((e) => (e.kind === 'quotation' ? e.quotationId : e.booking.id))).toEqual([
      'qa',
      'qb',
    ]);
  });

  it('does not mutate its inputs', () => {
    const rows = [row('t2'), row('t1')];
    const links = [link('t1', 'q1', 0), link('t2', 'q1', 1)];
    const rowsCopy = JSON.parse(JSON.stringify(rows));
    const linksCopy = JSON.parse(JSON.stringify(links));

    groupQuotationBookings(rows, links);

    expect(rows).toEqual(rowsCopy);
    expect(links).toEqual(linksCopy);
  });
});
