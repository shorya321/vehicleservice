/**
 * Rules for refunding a cancelled business booking to its wallet, shared by the admin dialog
 * and the server action. The database function refund_business_booking enforces the same
 * rules again under a row lock; these exist so the admin sees the reason before submitting.
 *
 * Pure: no Supabase, no React, so it unit-tests under the node jest config.
 */

import { z } from 'zod';
import { fromCents, toCents } from '@/lib/business/trips/pricing';

export const REFUND_REASON_MIN = 10;
export const REFUND_REASON_MAX = 200;

/** What is left to refund: what the wallet paid minus what has already gone back. Never negative. */
export function refundableAmount(paid: number, alreadyRefunded: number): number {
  return fromCents(Math.max(toCents(paid) - toCents(alreadyRefunded), 0));
}

/** The admin must type the booking number. Case and surrounding spaces are forgiven. */
export function refundConfirmationMatches(typed: string, bookingNumber: string): boolean {
  return typed.trim().toUpperCase() === bookingNumber.trim().toUpperCase() && bookingNumber.trim() !== '';
}

interface RefundCheck {
  bookingStatus: string;
  paid: number;
  alreadyRefunded: number;
  amount: number;
}

/** Null when the refund may go ahead, else the reason it may not. */
export function refundBlockedReason({ bookingStatus, paid, alreadyRefunded, amount }: RefundCheck): string | null {
  if (bookingStatus !== 'cancelled') return 'Cancel the booking before refunding it.';
  if (toCents(paid) <= 0) return 'Nothing was charged to the wallet for this booking.';
  const refundable = refundableAmount(paid, alreadyRefunded);
  if (refundable <= 0) return 'This booking has already been refunded in full.';
  if (!Number.isFinite(amount) || toCents(amount) <= 0) return 'Enter an amount above zero.';
  if (toCents(amount) > toCents(refundable)) return `You can refund at most AED ${refundable.toFixed(2)}.`;
  return null;
}

export const businessRefundRequestSchema = z.object({
  bookingId: z.string().uuid('Invalid booking'),
  amount: z
    .number()
    .positive('Enter an amount above zero')
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Use at most two decimals'),
  reason: z
    .string()
    .trim()
    .min(REFUND_REASON_MIN, `Give a reason of at least ${REFUND_REASON_MIN} characters`)
    .max(REFUND_REASON_MAX, `Keep the reason under ${REFUND_REASON_MAX} characters`),
  confirmation: z.string().trim().min(1, 'Type the booking number to confirm'),
});

export type BusinessRefundRequest = z.infer<typeof businessRefundRequestSchema>;
