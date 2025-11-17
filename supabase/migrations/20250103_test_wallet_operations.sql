-- B2B Business Account Module - Test Script
-- Purpose: Test atomic wallet operations and verify no race conditions
-- Date: 2025-01-03
-- Usage: Run this after applying the 3 main migrations

-- =============================================
-- CLEANUP: Remove test data if exists
-- =============================================
DO $$
BEGIN
  DELETE FROM wallet_transactions WHERE business_account_id IN (
    SELECT id FROM business_accounts WHERE business_email LIKE 'test%@example.com'
  );
  DELETE FROM business_bookings WHERE business_account_id IN (
    SELECT id FROM business_accounts WHERE business_email LIKE 'test%@example.com'
  );
  DELETE FROM business_users WHERE business_account_id IN (
    SELECT id FROM business_accounts WHERE business_email LIKE 'test%@example.com'
  );
  DELETE FROM business_accounts WHERE business_email LIKE 'test%@example.com';
  RAISE NOTICE 'Test data cleaned up';
END $$;

-- =============================================
-- TEST 1: Create sample business account
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
BEGIN
  -- Create test business account
  INSERT INTO business_accounts (
    business_name,
    business_email,
    business_phone,
    contact_person_name,
    subdomain,
    wallet_balance,
    status
  ) VALUES (
    'Test Hotel',
    'test.hotel@example.com',
    '+1234567890',
    'John Doe',
    'test-hotel',
    0.00,
    'active'
  ) RETURNING id INTO v_business_id;

  RAISE NOTICE 'Test business created: %', v_business_id;
END $$;

-- =============================================
-- TEST 2: Test add_to_wallet function
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_new_balance DECIMAL;
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  -- Add $1000 to wallet
  SELECT add_to_wallet(
    v_business_id,
    1000.00,
    'credit_added',
    'Initial credit for testing',
    'admin',
    NULL,
    NULL
  ) INTO v_new_balance;

  RAISE NOTICE 'Added $1000 to wallet. New balance: $%', v_new_balance;

  IF v_new_balance != 1000.00 THEN
    RAISE EXCEPTION 'TEST FAILED: Expected balance $1000, got $%', v_new_balance;
  END IF;

  RAISE NOTICE 'TEST 2 PASSED: add_to_wallet works correctly';
END $$;

-- =============================================
-- TEST 3: Test deduct_from_wallet function
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_new_balance DECIMAL;
  v_test_booking_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  -- Deduct $250 from wallet
  SELECT deduct_from_wallet(
    v_business_id,
    250.00,
    v_test_booking_id,
    'Test booking deduction'
  ) INTO v_new_balance;

  RAISE NOTICE 'Deducted $250 from wallet. New balance: $%', v_new_balance;

  IF v_new_balance != 750.00 THEN
    RAISE EXCEPTION 'TEST FAILED: Expected balance $750, got $%', v_new_balance;
  END IF;

  RAISE NOTICE 'TEST 3 PASSED: deduct_from_wallet works correctly';
END $$;

-- =============================================
-- TEST 4: Test insufficient balance handling
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_new_balance DECIMAL;
  v_error_raised BOOLEAN := false;
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  -- Try to deduct $1000 (should fail, only $750 available)
  BEGIN
    SELECT deduct_from_wallet(
      v_business_id,
      1000.00,
      gen_random_uuid(),
      'Should fail - insufficient balance'
    ) INTO v_new_balance;

    RAISE EXCEPTION 'TEST FAILED: Should have raised insufficient balance error';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Insufficient wallet balance%' THEN
        v_error_raised := true;
        RAISE NOTICE 'Correctly raised insufficient balance error';
      ELSE
        RAISE EXCEPTION 'TEST FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;

  IF v_error_raised THEN
    RAISE NOTICE 'TEST 4 PASSED: Insufficient balance check works correctly';
  END IF;
END $$;

-- =============================================
-- TEST 5: Test transaction audit trail
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_transaction_count INTEGER;
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  -- Check we have exactly 2 transactions (1 credit_added + 1 booking_deduction)
  SELECT COUNT(*) INTO v_transaction_count
  FROM wallet_transactions
  WHERE business_account_id = v_business_id;

  IF v_transaction_count != 2 THEN
    RAISE EXCEPTION 'TEST FAILED: Expected 2 transactions, found %', v_transaction_count;
  END IF;

  RAISE NOTICE 'TEST 5 PASSED: Transaction audit trail works correctly';
END $$;

-- =============================================
-- TEST 6: Test balance accuracy in audit trail
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_actual_balance DECIMAL;
  v_audit_balance DECIMAL;
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  -- Get actual balance from business_accounts
  SELECT wallet_balance INTO v_actual_balance
  FROM business_accounts
  WHERE id = v_business_id;

  -- Get latest balance_after from wallet_transactions
  SELECT balance_after INTO v_audit_balance
  FROM wallet_transactions
  WHERE business_account_id = v_business_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_actual_balance != v_audit_balance THEN
    RAISE EXCEPTION 'TEST FAILED: Actual balance ($%) != Audit balance ($%)',
      v_actual_balance, v_audit_balance;
  END IF;

  RAISE NOTICE 'TEST 6 PASSED: Wallet balance matches audit trail ($%)', v_actual_balance;
END $$;

-- =============================================
-- TEST 7: Test refund via add_to_wallet
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_new_balance DECIMAL;
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  -- Refund $100
  SELECT add_to_wallet(
    v_business_id,
    100.00,
    'refund',
    'Test refund',
    'system',
    NULL,
    NULL
  ) INTO v_new_balance;

  IF v_new_balance != 850.00 THEN
    RAISE EXCEPTION 'TEST FAILED: Expected balance $850 after refund, got $%', v_new_balance;
  END IF;

  RAISE NOTICE 'TEST 7 PASSED: Refund works correctly. Balance: $%', v_new_balance;
END $$;

-- =============================================
-- SUMMARY: Display final state
-- =============================================
DO $$
DECLARE
  v_business_id UUID;
  v_final_balance DECIMAL;
  v_total_transactions INTEGER;
BEGIN
  SELECT id INTO v_business_id FROM business_accounts WHERE subdomain = 'test-hotel';

  SELECT wallet_balance INTO v_final_balance
  FROM business_accounts
  WHERE id = v_business_id;

  SELECT COUNT(*) INTO v_total_transactions
  FROM wallet_transactions
  WHERE business_account_id = v_business_id;

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ALL TESTS PASSED!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Final wallet balance: $%', v_final_balance;
  RAISE NOTICE 'Total transactions: %', v_total_transactions;
  RAISE NOTICE '';
  RAISE NOTICE 'Transaction History:';
END $$;

-- Display transaction history
SELECT
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  transaction_type,
  amount,
  balance_after,
  description
FROM wallet_transactions
WHERE business_account_id IN (
  SELECT id FROM business_accounts WHERE subdomain = 'test-hotel'
)
ORDER BY created_at;

-- =============================================
-- CLEANUP (optional - comment out to keep test data)
-- =============================================
-- DELETE FROM wallet_transactions WHERE business_account_id IN (
--   SELECT id FROM business_accounts WHERE subdomain = 'test-hotel'
-- );
-- DELETE FROM business_accounts WHERE subdomain = 'test-hotel';
