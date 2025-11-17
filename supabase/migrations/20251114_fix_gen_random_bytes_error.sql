-- ============================================================================
-- Fix gen_random_bytes Function Not Found Error
-- ============================================================================
-- Migration: 20251114_fix_gen_random_bytes_error
-- Purpose: Replace gen_random_bytes with gen_random_uuid to avoid search_path issues
--
-- ROOT CAUSE: generate_auto_recharge_idempotency_key calls gen_random_bytes(8)
--             which requires pgcrypto extension in search_path, causing:
--             "function gen_random_bytes(integer) does not exist"
--
-- FIX: Use built-in gen_random_uuid() instead (no extension dependencies)
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION generate_auto_recharge_idempotency_key(
  p_business_account_id UUID
)
RETURNS VARCHAR(255)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_timestamp BIGINT;
  v_random_hash TEXT;
  v_key VARCHAR(255);
BEGIN
  v_timestamp := EXTRACT(EPOCH FROM now())::BIGINT;

  -- ✅ FIXED: Use gen_random_uuid() instead of gen_random_bytes()
  -- gen_random_uuid() is built-in and doesn't require pgcrypto in search_path
  v_random_hash := replace(gen_random_uuid()::TEXT, '-', '');

  v_key := p_business_account_id::TEXT || ':' || v_timestamp::TEXT || ':' || v_random_hash;

  RETURN v_key;
END;
$$;

COMMENT ON FUNCTION generate_auto_recharge_idempotency_key IS
  'Generates unique idempotency key for auto-recharge attempts using gen_random_uuid';

COMMIT;
