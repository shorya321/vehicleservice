-- Add HMAC signature columns to bookings for payment integrity verification
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS price_signature TEXT,
  ADD COLUMN IF NOT EXISTS price_signature_timestamp BIGINT,
  ADD COLUMN IF NOT EXISTS price_signature_nonce TEXT;

-- Unique index on nonce to prevent replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_price_signature_nonce
  ON bookings (price_signature_nonce)
  WHERE price_signature_nonce IS NOT NULL;
