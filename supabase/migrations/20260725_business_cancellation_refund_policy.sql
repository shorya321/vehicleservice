-- Business cancellation refund policy
-- Migration: 20260725_business_cancellation_refund_policy
-- Date: 2026-07-25
-- Description: cancel_business_booking_with_refund always refunded the FULL
--              wallet_deduction_amount regardless of how close to pickup the cancellation was.
--              That contradicts the policy the platform publishes to customers
--              (app/contact/components/contact-faq.tsx: "free cancellation up to 24 hours before
--              your scheduled pickup") and the rule already enforced for consumers in
--              app/account/booking-actions.ts. A business could cancel ten minutes before pickup
--              and take 100% back, while a consumer could not cancel at all inside 24 hours.
--
--              Adds one optional parameter so the caller can apply the tier it computed:
--
--                p_refund_amount IS NULL -> refund in full (previous behaviour, unchanged)
--                p_refund_amount = 0     -> cancel with NO refund, and write NO wallet
--                                           transaction, because no money moved
--                p_refund_amount > 0     -> refund exactly that, clamped to the original
--                                           deduction so a caller can never over-refund
--
--              The status guard is deliberately untouched: 'completed' stays non-refundable
--              because the trip was delivered and the money is earned.
--
--              Safe to extend — the function has exactly one caller,
--              app/api/business/bookings/[id]/cancel/route.ts.
--
--              Backward compatible: the new parameter has a DEFAULT, so the old 2-argument call
--              signature keeps resolving. Postgres treats differing argument counts as separate
--              overloads, so the previous 2-arg version is dropped first to avoid
--              "could not choose a best candidate function" ambiguity.

DROP FUNCTION IF EXISTS public.cancel_business_booking_with_refund(uuid, text);

CREATE OR REPLACE FUNCTION public.cancel_business_booking_with_refund(
  p_booking_id uuid,
  p_cancellation_reason text,
  p_refund_amount numeric DEFAULT NULL
)
RETURNS TABLE(refund_amount numeric, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_id UUID;
  v_deducted DECIMAL;
  v_refund DECIMAL;
  v_new_balance DECIMAL;
  v_booking_number TEXT;
  v_booking_status TEXT;
BEGIN
  -- Lock booking row and get details
  SELECT
    business_account_id,
    wallet_deduction_amount,
    booking_number,
    booking_status
  INTO
    v_business_id,
    v_deducted,
    v_booking_number,
    v_booking_status
  FROM business_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Unchanged: a completed trip was delivered, so its money is earned, not refundable.
  IF v_booking_status IN ('cancelled', 'completed', 'refunded') THEN
    RAISE EXCEPTION 'Cannot cancel booking with status: %', v_booking_status;
  END IF;

  -- NULL means "full refund" so any legacy 2-argument call behaves exactly as before.
  v_refund := COALESCE(p_refund_amount, v_deducted);

  -- Never refund more than was actually taken, and never a negative amount.
  v_refund := LEAST(GREATEST(v_refund, 0), COALESCE(v_deducted, 0));

  UPDATE business_bookings
  SET
    booking_status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  IF v_refund > 0 THEN
    SELECT add_to_wallet(
      v_business_id,
      v_refund,
      'refund',
      'Refund for cancelled booking ' || v_booking_number,
      'system',
      p_booking_id,
      NULL
    ) INTO v_new_balance;
  ELSE
    -- No money moved, so no wallet transaction is written. A zero-amount row would be noise
    -- in the ledger and would imply a refund that did not happen.
    SELECT wallet_balance INTO v_new_balance
    FROM business_accounts
    WHERE id = v_business_id;
  END IF;

  RETURN QUERY SELECT v_refund, v_new_balance;
END;
$function$;

COMMENT ON FUNCTION public.cancel_business_booking_with_refund IS
  'Cancels a business booking and refunds the caller-supplied amount (NULL = full refund, 0 = none). Refund is clamped to the original deduction. Completed bookings remain non-refundable.';
