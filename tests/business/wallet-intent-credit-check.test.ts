/**
 * When the wallet's backup path may credit a Payment Element or saved-card top-up.
 *
 * The Stripe webhook is the primary crediting path. It also saves the card and sends the
 * credit email, and it returns early once a wallet_transactions row exists for the
 * PaymentIntent. So a backup that credits immediately would always beat the webhook and
 * silently stop cards being saved and emails being sent. The backup therefore waits a
 * grace period, measured from the charge (not the intent: Payment Element creates the
 * intent before the card is typed, so the intent can be minutes old at payment time).
 */

import type Stripe from 'stripe';
import { checkWalletIntent } from '@/lib/business/wallet/intent-credit-check';

const BUSINESS = 'biz-1';
const NOW = 1_800_000_000;

function intent(overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent {
  return {
    id: 'pi_test',
    status: 'succeeded',
    amount_received: 25_000,
    created: NOW - 600,
    metadata: { business_account_id: BUSINESS },
    latest_charge: { id: 'ch_test', created: NOW - 60 } as Stripe.Charge,
    ...overrides,
  } as Stripe.PaymentIntent;
}

describe('checkWalletIntent', () => {
  it('refuses an intent that belongs to another business', () => {
    const result = checkWalletIntent(
      intent({ metadata: { business_account_id: 'other' } }),
      BUSINESS,
      NOW,
    );
    expect(result).toEqual({ kind: 'forbidden' });
  });

  it('refuses an intent with no business at all (a booking payment)', () => {
    expect(checkWalletIntent(intent({ metadata: {} }), BUSINESS, NOW)).toEqual({
      kind: 'forbidden',
    });
  });

  it.each(['processing', 'requires_action', 'requires_payment_method', 'canceled'] as const)(
    'does not credit a %s intent',
    (status) => {
      expect(checkWalletIntent(intent({ status }), BUSINESS, NOW)).toEqual({ kind: 'not_paid' });
    },
  );

  it('does not credit a zero amount', () => {
    expect(checkWalletIntent(intent({ amount_received: 0 }), BUSINESS, NOW)).toEqual({
      kind: 'not_paid',
    });
  });

  it('waits while the charge is younger than the grace period', () => {
    const result = checkWalletIntent(
      intent({ latest_charge: { id: 'ch', created: NOW - 5 } as Stripe.Charge }),
      BUSINESS,
      NOW,
    );
    expect(result).toEqual({ kind: 'wait' });
  });

  it('measures age from the charge even when the intent itself is old', () => {
    const result = checkWalletIntent(
      intent({
        created: NOW - 3600,
        latest_charge: { id: 'ch', created: NOW - 10 } as Stripe.Charge,
      }),
      BUSINESS,
      NOW,
    );
    expect(result).toEqual({ kind: 'wait' });
  });

  it('credits the received amount in AED once the grace period has passed', () => {
    const result = checkWalletIntent(
      intent({ latest_charge: { id: 'ch', created: NOW - 25 } as Stripe.Charge }),
      BUSINESS,
      NOW,
    );
    expect(result).toEqual({ kind: 'credit', amount: 250 });
  });

  it('waits when the charge was not expanded, rather than guessing its age', () => {
    expect(checkWalletIntent(intent({ latest_charge: 'ch_unexpanded' }), BUSINESS, NOW)).toEqual({
      kind: 'wait',
    });
  });

  it('honours a custom grace period', () => {
    const result = checkWalletIntent(
      intent({ latest_charge: { id: 'ch', created: NOW - 25 } as Stripe.Charge }),
      BUSINESS,
      NOW,
      60,
    );
    expect(result).toEqual({ kind: 'wait' });
  });
});
