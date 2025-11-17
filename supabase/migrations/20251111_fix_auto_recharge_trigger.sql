/**
 * Fix Auto-Recharge Trigger
 * Remove pg_notify call that doesn't work with Edge Functions
 *
 * The original trigger used pg_notify to notify an Edge Function,
 * but Edge Functions are HTTP-based and can't listen to PostgreSQL notifications.
 *
 * Instead, we'll let the trigger create auto_recharge_attempt records,
 * and a scheduled job will process pending attempts via HTTP API.
 */

-- Update the trigger function to remove pg_notify
CREATE OR REPLACE FUNCTION check_and_trigger_auto_recharge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_current_balance DECIMAL;
  v_idempotency_key VARCHAR(255);
  v_within_limit BOOLEAN;
  v_attempt_id UUID;
BEGIN
  -- Only trigger for deductions (negative amounts)
  IF NEW.transaction_type != 'booking_deduction' THEN
    RETURN NEW;
  END IF;

  -- Get auto-recharge settings
  SELECT * INTO v_settings
  FROM auto_recharge_settings
  WHERE business_account_id = NEW.business_account_id
    AND enabled = true;

  -- Exit if auto-recharge not enabled
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get current balance from business_accounts
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = NEW.business_account_id;

  -- Check if balance is below threshold
  IF v_current_balance >= v_settings.trigger_threshold THEN
    RETURN NEW;
  END IF;

  -- Check monthly limit
  v_within_limit := check_monthly_auto_recharge_limit(
    NEW.business_account_id,
    v_settings.recharge_amount
  );

  IF NOT v_within_limit THEN
    -- Log that limit was reached (don't create attempt)
    RAISE NOTICE 'Auto-recharge monthly limit reached for business %', NEW.business_account_id;
    RETURN NEW;
  END IF;

  -- Generate idempotency key
  v_idempotency_key := generate_auto_recharge_idempotency_key(NEW.business_account_id);

  -- Create auto-recharge attempt (idempotent)
  INSERT INTO auto_recharge_attempts (
    business_account_id,
    trigger_balance,
    trigger_threshold,
    requested_amount,
    currency,
    payment_method_id,
    idempotency_key,
    status,
    next_retry_at
  )
  VALUES (
    NEW.business_account_id,
    v_current_balance,
    v_settings.trigger_threshold,
    v_settings.recharge_amount,
    v_settings.currency,
    CASE
      WHEN v_settings.use_default_payment_method THEN
        (SELECT id FROM payment_methods
         WHERE business_account_id = NEW.business_account_id
           AND is_default = true
           AND is_active = true
         LIMIT 1)
      ELSE v_settings.payment_method_id
    END,
    v_idempotency_key,
    'pending',
    now() -- Process immediately on next scheduled run
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_attempt_id;

  -- Log attempt creation
  IF v_attempt_id IS NOT NULL THEN
    RAISE NOTICE 'Auto-recharge attempt created: % for business %', v_attempt_id, NEW.business_account_id;
  END IF;

  -- Note: Removed pg_notify call here - Edge Functions can't listen to it
  -- Instead, use scheduled job (cron) or manual trigger to process pending attempts
  -- via HTTP API: GET /api/business/wallet/auto-recharge/process-pending

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION check_and_trigger_auto_recharge() IS
'Triggered after wallet deductions to check if auto-recharge is needed. Creates auto_recharge_attempt records for processing by HTTP API.';
