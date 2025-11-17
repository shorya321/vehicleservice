-- Add payment_status column to business_bookings table
-- Migration: 20251117_add_payment_status_to_business_bookings
-- Date: 2025-11-17
-- Description: Add payment_status tracking for business bookings.
--              Since business bookings use prepaid wallet (deducted atomically),
--              payment status is always 'completed' upon booking creation.

-- Add payment_status column with default 'completed'
ALTER TABLE business_bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed'
CHECK (payment_status IN ('completed', 'processing', 'failed', 'refunded'));

-- Add comment explaining the column
COMMENT ON COLUMN business_bookings.payment_status IS
  'Payment status for business booking. Always completed since wallet is deducted atomically on creation.';

-- Update existing rows to have 'completed' status (idempotent)
UPDATE business_bookings
SET payment_status = 'completed'
WHERE payment_status IS NULL OR payment_status = 'pending';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added payment_status column to business_bookings table';
  RAISE NOTICE 'All existing bookings set to payment_status = completed';
END $$;
