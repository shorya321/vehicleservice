/**
 * Quotation lifecycle rules.
 *
 * These encode product decisions rather than mechanics, so they are worth pinning: a
 * regression here would either block a business from renegotiating a live quote, or let
 * someone edit a trip whose wallet has already been charged.
 */

import {
  normalizeQuotationStatus,
  isQuotationExpired,
  displayStatus,
  canEditHeader,
  canEditLine,
  canConvert,
  canDelete,
  shouldRelockExchangeRate,
} from '@/lib/business/quotations/status';

describe('normalizeQuotationStatus', () => {
  it('passes through known statuses', () => {
    expect(normalizeQuotationStatus('accepted')).toBe('accepted');
  });

  it('falls back to draft for anything unrecognised, since the column is plain TEXT', () => {
    expect(normalizeQuotationStatus('nonsense')).toBe('draft');
    expect(normalizeQuotationStatus(null)).toBe('draft');
    expect(normalizeQuotationStatus(undefined)).toBe('draft');
  });
});

describe('isQuotationExpired', () => {
  it('expires an outstanding quotation past its validity date', () => {
    expect(isQuotationExpired('sent', '2026-07-01', '2026-07-22')).toBe(true);
    expect(isQuotationExpired('draft', '2026-07-01', '2026-07-22')).toBe(true);
  });

  it('does not expire on the validity date itself', () => {
    expect(isQuotationExpired('sent', '2026-07-22', '2026-07-22')).toBe(false);
  });

  it('never expires once accepted or converted — the window has served its purpose', () => {
    expect(isQuotationExpired('accepted', '2026-07-01', '2026-07-22')).toBe(false);
    expect(isQuotationExpired('converted', '2026-07-01', '2026-07-22')).toBe(false);
    expect(isQuotationExpired('partially_converted', '2026-07-01', '2026-07-22')).toBe(false);
  });

  it('never expires without a validity date', () => {
    expect(isQuotationExpired('sent', null, '2026-07-22')).toBe(false);
  });

  it('surfaces as a display status without being stored', () => {
    expect(displayStatus('sent', '2026-07-01', '2026-07-22')).toBe('expired');
    expect(displayStatus('sent', '2026-08-01', '2026-07-22')).toBe('sent');
  });
});

describe('canEditHeader', () => {
  it('allows editing a sent or accepted quotation — customers renegotiate after saying yes', () => {
    expect(canEditHeader('draft')).toBe(true);
    expect(canEditHeader('sent')).toBe(true);
    expect(canEditHeader('accepted')).toBe(true);
  });

  it('blocks editing while converting or once converted', () => {
    expect(canEditHeader('converting')).toBe(false);
    expect(canEditHeader('converted')).toBe(false);
  });

  it('still allows editing a partially converted quotation', () => {
    expect(canEditHeader('partially_converted')).toBe(true);
  });
});

describe('canEditLine', () => {
  it('locks a line the moment it becomes a booking, whatever the header says', () => {
    expect(canEditLine('accepted', 'booking-uuid')).toBe(false);
    expect(canEditLine('partially_converted', 'booking-uuid')).toBe(false);
  });

  it('leaves unconverted lines of a partially converted quotation editable', () => {
    expect(canEditLine('partially_converted', null)).toBe(true);
  });

  it('blocks every line while a conversion is in flight', () => {
    expect(canEditLine('converting', null)).toBe(false);
  });
});

describe('canConvert', () => {
  it('requires acceptance', () => {
    expect(canConvert('draft')).toBe(false);
    expect(canConvert('sent')).toBe(false);
    expect(canConvert('accepted')).toBe(true);
  });

  it('allows resuming a partially converted run', () => {
    expect(canConvert('partially_converted')).toBe(true);
  });

  it('does not offer conversion for a finished or in-flight one', () => {
    expect(canConvert('converted')).toBe(false);
    expect(canConvert('converting')).toBe(false);
  });
});

describe('canDelete', () => {
  it('blocks deletion once any line has become a booking', () => {
    expect(canDelete('accepted', true)).toBe(false);
    expect(canDelete('partially_converted', true)).toBe(false);
  });

  it('allows deleting an untouched quotation', () => {
    expect(canDelete('draft', false)).toBe(true);
    expect(canDelete('rejected', false)).toBe(true);
  });
});

describe('shouldRelockExchangeRate', () => {
  it('re-locks only while still a draft', () => {
    expect(shouldRelockExchangeRate('draft')).toBe(true);
  });

  it('never re-rates a quotation the customer is already holding', () => {
    expect(shouldRelockExchangeRate('sent')).toBe(false);
    expect(shouldRelockExchangeRate('accepted')).toBe(false);
  });
});
