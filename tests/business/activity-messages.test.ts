/**
 * The activity feed is the only surviving record of several destructive
 * actions, so its renderer has to be trustworthy: every catalogued action must
 * produce a readable sentence, an unknown action must degrade rather than blank
 * the row, and a raw JSON dump must never reach an owner.
 */

import {
  BUSINESS_ACTIVITY_ACTIONS,
  getActivityDefinition,
  isKnownActivityAction,
  ACTIVITY_CATEGORIES,
} from '@/lib/business/activity/catalog';
import {
  renderActivityMessage,
  activityMessageToText,
  entityHref,
} from '@/lib/business/activity/messages';
import {
  buildDiffRows,
  buildFactRows,
  buildReferenceList,
  formatValue,
  fieldLabel,
} from '@/lib/business/activity/format-details';
import type { ActivityEvent } from '@/lib/business/activity/types';

function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    businessAccountId: '22222222-2222-2222-2222-222222222222',
    actorType: 'business_user',
    actorAuthUserId: null,
    actorBusinessUserId: '33333333-3333-3333-3333-333333333333',
    actorRole: 'owner',
    actorName: 'Sarah Khan',
    actorEmail: 'sarah@acme.com',
    action: 'booking.created',
    category: 'booking',
    severity: 'important',
    entityType: 'business_booking',
    entityId: '44444444-4444-4444-4444-444444444444',
    entityLabel: 'BK-2026-0031',
    changes: null,
    metadata: {},
    amount: null,
    currency: null,
    ipAddress: null,
    userAgent: null,
    requestId: null,
    createdAt: '2026-08-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('activity catalog', () => {
  it('files every action under a real category and severity', () => {
    for (const [action, definition] of Object.entries(BUSINESS_ACTIVITY_ACTIONS)) {
      expect(ACTIVITY_CATEGORIES).toContain(definition.category);
      expect(['info', 'important', 'critical']).toContain(definition.severity);
      expect(action).toMatch(/^[a-z]+\.[a-z0-9_]+$/);
    }
  });

  it('treats every destructive no-refund action as critical', () => {
    // These are the actions where money disappears with no automatic recovery.
    // If one of them is ever downgraded, the owner stops being warned.
    const mustBeCritical = [
      'booking.deleted',
      'booking.bulk_deleted',
      'booking.cancelled_by_admin',
      'team.member_removed',
      'wallet.frozen',
      'account.suspended',
    ] as const;
    for (const action of mustBeCritical) {
      expect(BUSINESS_ACTIVITY_ACTIONS[action].severity).toBe('critical');
    }
  });

  it('degrades an unknown action instead of throwing', () => {
    expect(isKnownActivityAction('booking.teleported')).toBe(false);
    const definition = getActivityDefinition('booking.teleported');
    expect(definition.category).toBe('booking');
    expect(definition.severity).toBe('info');
  });

  it('falls back to the account category for an unparseable action', () => {
    expect(getActivityDefinition('nonsense').category).toBe('account');
  });
});

describe('renderActivityMessage', () => {
  it('renders a sentence for every catalogued action', () => {
    for (const action of Object.keys(BUSINESS_ACTIVITY_ACTIONS)) {
      const segments = renderActivityMessage(makeEvent({ action }));
      const text = activityMessageToText(segments);
      expect(segments.length).toBeGreaterThan(0);
      expect(text.length).toBeGreaterThan(0);
      // A leaked placeholder means a template references a key nothing supplies.
      expect(text).not.toMatch(/[{}]/);
    }
  });

  it('never emits a JSON dump for object valued metadata', () => {
    const segments = renderActivityMessage(
      makeEvent({
        action: 'settings.company_profile_updated',
        metadata: { nested: { deeply: { bad: true } }, list: [1, 2, 3] },
      })
    );
    const text = activityMessageToText(segments);
    expect(text).not.toContain('{');
    expect(text).not.toContain('[object Object]');
  });

  it('drops an optional clause whose value is missing, and tidies punctuation', () => {
    const withReason = activityMessageToText(
      renderActivityMessage(
        makeEvent({ action: 'account.suspended', metadata: { reason_public: 'Unpaid invoice' } })
      )
    );
    expect(withReason).toContain('Unpaid invoice');

    const withoutReason = activityMessageToText(
      renderActivityMessage(makeEvent({ action: 'account.suspended', metadata: {} }))
    );
    expect(withoutReason).toContain('suspended your account');
    expect(withoutReason).not.toContain('reason_public');
    // No dangling separator left where the clause used to be.
    expect(withoutReason).not.toMatch(/\.\s*\.$/);
    expect(withoutReason.trim()).toBe(withoutReason);
  });

  it('states plainly that a deleted booking was not refunded', () => {
    const text = activityMessageToText(
      renderActivityMessage(makeEvent({ action: 'booking.deleted' }))
    );
    expect(text).toContain('No refund was issued');
  });

  it('formats money through the injected formatter so currency conversion applies', () => {
    const segments = renderActivityMessage(
      makeEvent({ action: 'wallet.debited', amount: 480, currency: 'AED' }),
      { formatMoney: (amount, currency) => `${currency} ${amount.toFixed(2)} (converted)` }
    );
    expect(activityMessageToText(segments)).toContain('AED 480.00 (converted)');
    expect(segments.some((segment) => segment.kind === 'amount')).toBe(true);
  });

  it('renders a deleted entity as struck through text rather than a dead link', () => {
    const segments = renderActivityMessage(makeEvent(), { liveEntityIds: new Set<string>() });
    const entity = segments.find((segment) => segment.kind === 'entity');
    expect(entity?.deleted).toBe(true);
    expect(entity?.href).toBeUndefined();
  });

  it('links an entity that still exists', () => {
    const event = makeEvent();
    const segments = renderActivityMessage(event, {
      liveEntityIds: new Set([event.entityId as string]),
    });
    const entity = segments.find((segment) => segment.kind === 'entity');
    expect(entity?.deleted).toBeUndefined();
    expect(entity?.href).toBe(`/business/bookings/${event.entityId}`);
  });

  it('degrades an unknown action to a readable label', () => {
    const text = activityMessageToText(
      renderActivityMessage(makeEvent({ action: 'booking.teleported_to_mars' }))
    );
    expect(text).toContain('Teleported to mars');
    expect(text).toContain('Sarah Khan');
  });

  it('keeps the actor out of platform-initiated sentences', () => {
    // The owner must never see a platform admin's name or email.
    const text = activityMessageToText(
      renderActivityMessage(
        makeEvent({ action: 'wallet.frozen', actorType: 'admin', actorName: 'Platform admin' })
      )
    );
    expect(text).toContain('Platform admin froze your wallet');
  });
});

describe('entityHref', () => {
  it('maps each linkable entity type to its portal route', () => {
    expect(entityHref(makeEvent({ entityType: 'quotation', entityId: 'q1' }))).toBe(
      '/business/quotations/q1'
    );
    expect(entityHref(makeEvent({ entityType: 'wallet_transaction', entityId: 't1' }))).toBe(
      '/business/wallet/transactions?highlight=t1'
    );
    expect(entityHref(makeEvent({ entityType: 'business_user', entityId: 'u1' }))).toBe(
      '/business/team'
    );
  });

  it('returns null when there is nowhere to go', () => {
    expect(entityHref(makeEvent({ entityId: null }))).toBeNull();
    expect(entityHref(makeEvent({ entityType: 'setting', entityId: 's1' }))).toBeNull();
  });
});

describe('format-details', () => {
  it('builds a before and after row per changed field', () => {
    const rows = buildDiffRows({
      brand_name: { from: 'Acme', to: 'Acme Travel' },
      primary_color: { from: '#000000', to: '#111111' },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ label: 'Brand name', before: 'Acme', after: 'Acme Travel' });
    expect(rows[1].label).toBe('Primary colour');
  });

  it('returns nothing when there is no diff', () => {
    expect(buildDiffRows(null)).toEqual([]);
    expect(buildDiffRows({})).toEqual([]);
  });

  it('formats values for a non-technical reader', () => {
    expect(formatValue(null)).toBe('Not set');
    expect(formatValue('')).toBe('Not set');
    expect(formatValue(true)).toBe('Yes');
    expect(formatValue(false)).toBe('No');
    expect(formatValue(12)).toBe('12');
    expect(formatValue(12.5)).toBe('12.50');
    expect(formatValue([1, 2, 3])).toBe('3 items');
    expect(formatValue({ a: 1, b: 2 })).toBe('2 fields');
  });

  it('titles an unmapped field rather than showing the raw column name', () => {
    expect(fieldLabel('some_new_column')).toBe('Some new column');
  });

  it('hides plumbing keys from the facts list', () => {
    const rows = buildFactRows(
      makeEvent({
        metadata: {
          idempotency_key: 'pi_123',
          batch_id: 'b1',
          refs: ['BK-1', 'BK-2'],
          vendor_name: 'Desert Fleet',
        },
      })
    );
    const keys = rows.map((row) => row.key);
    expect(keys).toContain('vendor_name');
    expect(keys).not.toContain('idempotency_key');
    expect(keys).not.toContain('batch_id');
    expect(keys).not.toContain('refs');
  });

  it('includes the promoted amount column as a fact', () => {
    const rows = buildFactRows(makeEvent({ amount: 480, currency: 'AED' }));
    expect(rows.find((row) => row.key === 'amount')?.value).toBe('AED 480');
  });

  it('caps the reference list so one bulk row cannot render a thousand lines', () => {
    const refs = Array.from({ length: 25 }, (_, index) => `BK-${index}`);
    const result = buildReferenceList(makeEvent({ metadata: { refs } }), 20);
    expect(result.refs).toHaveLength(20);
    expect(result.remaining).toBe(5);
  });

  it('tolerates a missing or malformed reference list', () => {
    expect(buildReferenceList(makeEvent({ metadata: {} }))).toEqual({ refs: [], remaining: 0 });
    expect(buildReferenceList(makeEvent({ metadata: { refs: 'nope' } }))).toEqual({
      refs: [],
      remaining: 0,
    });
  });
});
