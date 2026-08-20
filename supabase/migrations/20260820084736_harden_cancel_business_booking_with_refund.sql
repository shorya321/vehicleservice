-- Mirror of the migration recorded server-side as
-- 20260820084736_harden_cancel_business_booking_with_refund.
-- Applied with the Supabase MCP apply_migration tool. Never run db push.
--
-- Business cancellation no longer refunds automatically. Two hardening changes,
-- both about the fact that this is a SECURITY DEFINER function that moves money
-- and performs no tenant-ownership check of its own: every ownership and role
-- check lives in the Next.js route that calls it.
--
-- 1. NULL must no longer mean "refund the whole deduction". That default made a
--    two-argument call a full refund, which is the opposite of the policy now in
--    force. The only caller passes an explicit 0.
--
-- 2. EXECUTE was held by PUBLIC, anon and authenticated. Anyone holding the anon
--    key and a booking UUID could call it with the refund argument omitted and
--    push the full amount into that tenant's wallet. The route uses the service
--    role, so service_role alone is sufficient.
--
-- The body is otherwise byte-identical to the previous live definition,
-- including the single booking_status -> 'cancelled' update, the FOR UPDATE row
-- lock, the settled-status guard and the activity log.

CREATE OR REPLACE FUNCTION public.cancel_business_booking_with_refund(
  p_booking_id uuid,
  p_cancellation_reason text,
  p_refund_amount numeric DEFAULT NULL::numeric,
  p_actor_business_user_id uuid DEFAULT NULL::uuid,
  p_actor_name text DEFAULT NULL::text
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

  IF v_booking_status IN ('cancelled', 'completed', 'refunded') THEN
    RAISE EXCEPTION 'Cannot cancel booking with status: %', v_booking_status;
  END IF;

  -- Refund nothing unless a caller asks for a specific amount. Was
  -- COALESCE of p_refund_amount with v_deducted, i.e. omitting the argument
  -- meant a full refund.
  v_refund := COALESCE(p_refund_amount, 0);
  v_refund := LEAST(GREATEST(v_refund, 0), COALESCE(v_deducted, 0));

  PERFORM set_config('app.skip_activity_status_log', '1', true);

  UPDATE business_bookings
  SET
    booking_status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  PERFORM set_config('app.skip_activity_status_log', '', true);

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
    SELECT wallet_balance INTO v_new_balance
    FROM business_accounts
    WHERE id = v_business_id;
  END IF;

  BEGIN
    PERFORM log_business_activity(
      p_business_account_id    => v_business_id,
      p_action                 => 'booking.cancelled',
      p_category               => 'booking',
      p_actor_type             => CASE WHEN p_actor_business_user_id IS NOT NULL
                                    THEN 'business_user' ELSE 'system' END,
      p_actor_name             => p_actor_name,
      p_actor_business_user_id => p_actor_business_user_id,
      p_severity               => 'important',
      p_entity_type            => 'business_booking',
      p_entity_id              => p_booking_id,
      p_entity_label           => v_booking_number,
      p_amount                 => v_refund,
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'refund_amount', v_refund,
        'original_amount', v_deducted,
        'refund_issued', v_refund > 0,
        'previous_status', v_booking_status,
        'reason_public', p_cancellation_reason,
        'refund_summary', CASE
          WHEN v_refund > 0 THEN 'A refund of AED ' || to_char(v_refund, 'FM999999990.00') || ' was issued'
          ELSE 'No refund was issued. Refunds are reviewed and issued by the platform team.'
        END
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'cancel_booking activity log failed: %', SQLERRM;
  END;

  RETURN QUERY SELECT v_refund, v_new_balance;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cancel_business_booking_with_refund(uuid, text, numeric, uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.cancel_business_booking_with_refund(uuid, text, numeric, uuid, text)
  TO service_role;
