-- ============================================================================
-- Add metadata Column to wallet_transactions Table
-- ============================================================================
-- Migration: 20251114_add_metadata_to_wallet_transactions
-- Purpose: Add missing metadata JSONB column that deduct_from_wallet function expects
--
-- ROOT CAUSE: The deduct_from_wallet function was updated to insert metadata,
--             but the wallet_transactions table doesn't have this column,
--             causing: "column metadata of relation wallet_transactions does not exist"
--
-- FIX: Add metadata column to match what the deployed function expects
-- ============================================================================

BEGIN;

-- Add metadata column to wallet_transactions table
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN wallet_transactions.metadata IS
  'Additional metadata for the transaction (booking_id, timestamps, admin actions, etc.)';

-- Create index for metadata queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_metadata
  ON wallet_transactions USING gin(metadata);

COMMIT;
