-- Business Activity Log - Step 5 (Migration B)
--
-- Adds activity capture INSIDE the money functions, so a log row exists if and
-- only if the change actually happened, and every present and future caller is
-- covered without touching their code.
--
-- Exactly three functions are modified. The four admin wallet-control functions
-- in 20250107_add_admin_wallet_controls.sql (admin_adjust_wallet,
-- freeze_business_wallet, unfreeze_business_wallet, set_spending_limits) are
-- deliberately NOT touched: they all gate on
--     profiles WHERE auth_user_id = ... AND user_role = 'admin'
-- and profiles has neither column (it has id and role), so all four raise on
-- every call and have never executed successfully. admin_wallet_audit_log is
-- empty, which confirms it. Adding log calls there would produce nothing.
-- Freeze, unfreeze and spending limits are captured by the column-scoped
-- business_accounts trigger in Migration C instead, which works no matter which
-- code path eventually writes those columns.
--
-- Each body below is the live pg_get_functiondef output, reproduced verbatim
-- apart from the added logging. In particular add_to_wallet and
-- create_booking_with_wallet_deduction have NO "SET search_path" and must not
-- gain one here: that would be a behaviour change smuggled into an unrelated
-- feature.

-- ============================================================================
-- add_to_wallet
--
-- The single choke point for all three credit types. It is reached by the
-- Stripe webhook, wallet/verify-payment, the admin credits route, and the
-- refund path inside cancel_business_booking_with_refund, so one insertion
-- point yields wallet.topup_succeeded, wallet.refunded and
-- wallet.credited_by_admin / wallet.debited_by_admin.
--
-- Placement is critical: the log call sits AFTER the duplicate-payment-intent
-- early return and AFTER the balance UPDATE. Logging before the early return
-- would add a phantom "topped up" row on every webhook retry.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_to_wallet(
  p_business_id uuid,
  p_amount numeric,
  p_transaction_type text,
  p_description text,
  p_created_by text DEFAULT 'system'::text,
  p_reference_id uuid DEFAULT NULL::uuid,
  p_stripe_payment_intent_id text DEFAULT NULL::text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current DECIMAL;
  v_new_balance DECIMAL;
  v_inserted INTEGER;
  v_tx_id UUID;
  v_action TEXT;
  v_actor_type TEXT;
  v_actor_name TEXT;
  v_severity TEXT;
  v_entity_label TEXT;
BEGIN
  IF p_transaction_type NOT IN ('credit_added', 'refund', 'admin_adjustment') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  -- Lock the business account row; also serializes concurrent credits for the
  -- same business (e.g. webhook vs client verify-payment).
  SELECT wallet_balance INTO v_current
  FROM business_accounts
  WHERE id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found: %', p_business_id;
  END IF;

  v_new_balance := v_current + p_amount;

  -- Insert the transaction FIRST. The partial unique index on
  -- stripe_payment_intent_id is the idempotency gate: a duplicate payment
  -- intent hits ON CONFLICT DO NOTHING and inserts nothing. A NULL payment
  -- intent (admin adjustment / refund) is not in the partial index, so it
  -- always inserts and always credits.
  INSERT INTO wallet_transactions (
    business_account_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after,
    created_by,
    stripe_payment_intent_id
  ) VALUES (
    p_business_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_reference_id,
    v_new_balance,
    p_created_by,
    p_stripe_payment_intent_id
  )
  ON CONFLICT (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_tx_id;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Duplicate payment intent: already processed. Do NOT credit again.
  IF v_inserted = 0 THEN
    RETURN v_current;
  END IF;

  UPDATE business_accounts
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_business_id;

  -- Activity log. Best effort: never allowed to affect the credit.
  BEGIN
    IF p_transaction_type = 'refund' THEN
      v_action := 'wallet.refunded';
      v_actor_type := 'system';
      v_actor_name := 'System';
      v_severity := 'important';
      SELECT booking_number INTO v_entity_label
      FROM business_bookings WHERE id = p_reference_id;
    ELSIF p_transaction_type = 'admin_adjustment' THEN
      v_action := CASE WHEN p_amount >= 0
        THEN 'wallet.credited_by_admin' ELSE 'wallet.debited_by_admin' END;
      v_actor_type := 'admin';
      -- Never the admin's name or email: the business sees a role, not a person.
      v_actor_name := 'Platform admin';
      v_severity := 'critical';
    ELSE
      v_action := 'wallet.topup_succeeded';
      v_actor_type := 'system';
      v_actor_name := CASE WHEN p_stripe_payment_intent_id IS NOT NULL
        THEN 'Stripe' ELSE 'System' END;
      v_severity := 'important';
    END IF;

    PERFORM log_business_activity(
      p_business_account_id    => p_business_id,
      p_action                 => v_action,
      p_category               => 'wallet',
      p_actor_type             => v_actor_type,
      p_actor_name             => v_actor_name,
      p_severity               => v_severity,
      p_entity_type            => CASE WHEN p_transaction_type = 'refund'
                                    THEN 'business_booking' ELSE 'wallet_transaction' END,
      p_entity_id              => COALESCE(p_reference_id, v_tx_id),
      p_entity_label           => v_entity_label,
      p_amount                 => ABS(p_amount),
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'balance_before', v_current,
        'balance_after', v_new_balance,
        'wallet_transaction_id', v_tx_id,
        -- Second idempotency guard, on top of the wallet_transactions index.
        'idempotency_key', p_stripe_payment_intent_id
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'add_to_wallet activity log failed: %', SQLERRM;
  END;

  RETURN v_new_balance;
END;
$function$;

-- ============================================================================
-- create_booking_with_wallet_deduction
--
-- The deduction is logged as part of booking.created rather than as its own
-- row: one line saying "created BK-2026-0031, AED 480" is what a non-technical
-- reader needs, and a second "wallet debited AED 480" beside it is noise.
-- deduct_from_wallet is therefore left completely untouched (it also has no
-- actor parameter, so a row from there would be anonymous anyway).
--
-- This also covers quotation conversion for free, because
-- lib/business/quotations/convert-item.ts calls this same function.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_booking_with_wallet_deduction(
  p_business_id uuid,
  p_created_by_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_pickup_address text,
  p_dropoff_address text,
  p_pickup_datetime timestamp with time zone,
  p_vehicle_type_id uuid,
  p_passenger_count integer,
  p_base_price numeric,
  p_total_price numeric,
  p_customer_notes text DEFAULT NULL::text,
  p_reference_number text DEFAULT NULL::text,
  p_price_signature text DEFAULT NULL::text,
  p_price_signature_timestamp bigint DEFAULT NULL::bigint,
  p_price_signature_nonce text DEFAULT NULL::text,
  p_adults integer DEFAULT 1,
  p_children integer DEFAULT 0,
  p_infants integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_booking_id UUID;
  v_deduct_result JSON;
  v_new_balance DECIMAL;
  v_temp_description TEXT;
  v_transaction_id UUID;
  v_booking_number TEXT;
BEGIN
  v_temp_description := 'Booking creation (pending booking ID)';

  v_deduct_result := deduct_from_wallet(
    p_business_id,
    p_total_price,
    v_temp_description,
    NULL::UUID,
    'AED'
  );

  v_new_balance := (v_deduct_result->>'new_balance')::DECIMAL;
  v_transaction_id := (v_deduct_result->>'transaction_id')::UUID;

  INSERT INTO business_bookings (
    business_account_id, created_by_user_id,
    customer_name, customer_email, customer_phone,
    from_location_id, to_location_id,
    pickup_address, dropoff_address, pickup_datetime,
    vehicle_type_id, passenger_count,
    adults, children, infants,
    base_price, total_price, wallet_deduction_amount,
    customer_notes, reference_number,
    booking_status, payment_status,
    price_signature, price_signature_timestamp, price_signature_nonce
  ) VALUES (
    p_business_id, p_created_by_user_id,
    p_customer_name, p_customer_email, p_customer_phone,
    p_from_location_id, p_to_location_id,
    p_pickup_address, p_dropoff_address, p_pickup_datetime,
    p_vehicle_type_id, p_passenger_count,
    p_adults, p_children, p_infants,
    p_base_price, p_total_price, p_total_price,
    p_customer_notes, p_reference_number,
    'confirmed', 'completed',
    p_price_signature, p_price_signature_timestamp, p_price_signature_nonce
  ) RETURNING id INTO v_booking_id;

  SELECT booking_number INTO v_booking_number
  FROM business_bookings WHERE id = v_booking_id;

  UPDATE wallet_transactions
  SET
    reference_id = v_booking_id,
    description = 'Booking deduction for ' || v_booking_number
  WHERE id = v_transaction_id;

  -- Activity log. Best effort: never allowed to fail a paid-for booking.
  BEGIN
    PERFORM log_business_activity(
      p_business_account_id    => p_business_id,
      p_action                 => 'booking.created',
      p_category               => 'booking',
      p_actor_type             => 'business_user',
      p_actor_business_user_id => p_created_by_user_id,
      p_severity               => 'important',
      p_entity_type            => 'business_booking',
      p_entity_id              => v_booking_id,
      p_entity_label           => v_booking_number,
      p_amount                 => p_total_price,
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'pickup_at', p_pickup_datetime,
        'pickup_clause', ' for ' || to_char(p_pickup_datetime, 'DD Mon YYYY at HH24:MI'),
        'passenger_count', p_passenger_count,
        'balance_after', v_new_balance,
        'wallet_transaction_id', v_transaction_id,
        'reference_number', p_reference_number
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_booking activity log failed: %', SQLERRM;
  END;

  RETURN v_booking_id;
END;
$function$;

-- ============================================================================
-- cancel_business_booking_with_refund
--
-- Two changes:
--   1. Two trailing-default actor parameters. Trailing defaults keep the
--      existing 2- and 3-argument call sites working unchanged, and the
--      RETURNS TABLE shape is identical so
--      app/api/business/bookings/[id]/cancel/route.ts needs no edit.
--      The old 3-arg function is dropped first: CREATE OR REPLACE with a
--      different argument count creates an OVERLOAD rather than replacing,
--      and the old body would keep running.
--   2. A transaction-local guard around its own UPDATE of booking_status.
--      Without it, the AFTER UPDATE OF booking_status trigger in Migration C
--      would fire here and emit a second, wrong row
--      ("Platform admin changed booking ... to cancelled") beside the correct
--      booking.cancelled. set_config(..., true) is transaction scoped, and it
--      works here precisely because the function and its trigger share one
--      transaction - unlike the cross-request GUC pattern, which does not work
--      under PostgREST.
--
-- The refund itself is NOT logged here. It goes through add_to_wallet, which
-- already emits wallet.refunded.
-- ============================================================================

DROP FUNCTION IF EXISTS public.cancel_business_booking_with_refund(uuid, text, numeric);

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

  v_refund := COALESCE(p_refund_amount, v_deducted);
  v_refund := LEAST(GREATEST(v_refund, 0), COALESCE(v_deducted, 0));

  -- Suppress the generic status-change trigger for this update: this function
  -- writes its own, richer booking.cancelled row below.
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

  -- Activity log. Best effort: never allowed to fail a cancellation.
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
          ELSE 'No refund was issued under the cancellation policy'
        END
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'cancel_booking activity log failed: %', SQLERRM;
  END;

  RETURN QUERY SELECT v_refund, v_new_balance;
END;
$function$;

-- DROP discarded the old grants. Restore them exactly as they were
-- (EXECUTE to PUBLIC, anon, authenticated, service_role). This preserves the
-- existing security posture rather than tightening or loosening it as a side
-- effect of an unrelated feature.
GRANT EXECUTE ON FUNCTION public.cancel_business_booking_with_refund(uuid, text, numeric, uuid, text)
  TO PUBLIC, anon, authenticated, service_role;
