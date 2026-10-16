-- Admin refund of a CANCELLED business booking back to its wallet, linked to the booking.
-- Never more than the booking's wallet charge, counting every earlier refund of it, so a
-- double click, a second admin or a retry can never refund twice. The row lock serialises
-- two refunds of the same booking.
CREATE OR REPLACE FUNCTION public.refund_business_booking(
  p_booking_id uuid,
  p_amount numeric,
  p_reason text,
  p_admin_email text
)
RETURNS TABLE(refunded_amount numeric, total_refunded numeric, refundable_after numeric, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_id uuid;
  v_booking_number text;
  v_status text;
  v_paid numeric;
  v_already numeric;
  v_refundable numeric;
  v_new_balance numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR round(p_amount, 2) <> p_amount THEN
    RAISE EXCEPTION 'Refund amount must be above zero with at most two decimals';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A refund reason of at least 10 characters is required';
  END IF;

  SELECT business_account_id, booking_number, booking_status, COALESCE(wallet_deduction_amount, 0)
  INTO v_business_id, v_booking_number, v_status, v_paid
  FROM business_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Only a cancelled booking can be refunded';
  END IF;

  SELECT COALESCE(sum(amount), 0) INTO v_already
  FROM wallet_transactions
  WHERE reference_id = p_booking_id
    AND business_account_id = v_business_id
    AND transaction_type = 'refund';

  v_refundable := v_paid - v_already;
  IF v_refundable <= 0 THEN
    RAISE EXCEPTION 'This booking has already been refunded in full';
  END IF;
  IF p_amount > v_refundable THEN
    RAISE EXCEPTION 'Refund exceeds the refundable amount of AED %', to_char(v_refundable, 'FM999999990.00');
  END IF;

  v_new_balance := add_to_wallet(
    v_business_id,
    p_amount,
    'refund',
    'Refund for ' || v_booking_number || ': ' || trim(p_reason),
    'admin:' || COALESCE(NULLIF(trim(p_admin_email), ''), 'unknown'),
    p_booking_id,
    NULL
  );

  IF p_amount = v_refundable THEN
    UPDATE business_bookings SET payment_status = 'refunded' WHERE id = p_booking_id;
  END IF;

  RETURN QUERY SELECT p_amount, v_already + p_amount, v_refundable - p_amount, v_new_balance;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.refund_business_booking(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_business_booking(uuid, numeric, text, text) TO service_role;
