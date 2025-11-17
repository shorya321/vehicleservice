-- B2B Business Account Module - Database Tables
-- Migration: Create business accounts tables
-- Date: 2025-01-03
-- Description: Creates 4 new tables for B2B module with proper constraints and indexes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE 1: business_accounts
-- Purpose: Store business/hotel/agency information and wallet balance
-- =============================================
CREATE TABLE IF NOT EXISTS business_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Business Information
  business_name TEXT NOT NULL,
  business_email TEXT NOT NULL UNIQUE,
  business_phone TEXT,
  contact_person_name TEXT,
  address TEXT,
  city TEXT,
  country_code TEXT,

  -- Wallet (Prepaid Balance)
  wallet_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Domain Configuration
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT false,
  custom_domain_verified_at TIMESTAMPTZ,
  domain_verification_token TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),

  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for business_accounts
CREATE INDEX idx_business_accounts_subdomain ON business_accounts(subdomain);
CREATE INDEX idx_business_accounts_custom_domain ON business_accounts(custom_domain)
  WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_business_accounts_status ON business_accounts(status);
CREATE INDEX idx_business_accounts_email ON business_accounts(business_email);

-- =============================================
-- TABLE 2: business_users
-- Purpose: Link Supabase auth users to business accounts
-- =============================================
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Business Reference
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Auth Reference
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User Information
  email TEXT NOT NULL,
  full_name TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for business_users
CREATE INDEX idx_business_users_business_id ON business_users(business_account_id);
CREATE INDEX idx_business_users_auth_id ON business_users(auth_user_id);

-- =============================================
-- TABLE 3: business_bookings
-- Purpose: Store bookings created by businesses on behalf of their customers
-- =============================================
CREATE TABLE IF NOT EXISTS business_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE,

  -- Business Reference
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE RESTRICT,
  created_by_user_id UUID REFERENCES business_users(id) ON DELETE SET NULL,
  reference_number TEXT, -- Business's own reference

  -- Customer Information (actual passenger)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Route and Location
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  from_zone_id UUID,
  to_zone_id UUID,
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_datetime TIMESTAMPTZ NOT NULL,

  -- Vehicle and Passengers
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  passenger_count INTEGER DEFAULT 1 CHECK (passenger_count > 0),
  luggage_count INTEGER DEFAULT 0 CHECK (luggage_count >= 0),

  -- Pricing
  base_price DECIMAL(10, 2),
  amenities_price DECIMAL(10, 2) DEFAULT 0.00,
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  currency TEXT DEFAULT 'USD',
  wallet_deduction_amount DECIMAL(10, 2) NOT NULL CHECK (wallet_deduction_amount > 0),

  -- Status
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN
    ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded')),

  -- Notes
  customer_notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for business_bookings
CREATE INDEX idx_business_bookings_business_id ON business_bookings(business_account_id);
CREATE INDEX idx_business_bookings_status ON business_bookings(booking_status);
CREATE INDEX idx_business_bookings_pickup_date ON business_bookings(pickup_datetime);
CREATE INDEX idx_business_bookings_customer_email ON business_bookings(customer_email);
CREATE INDEX idx_business_bookings_number ON business_bookings(booking_number);

-- =============================================
-- TABLE 4: wallet_transactions
-- Purpose: Audit trail for all wallet balance changes
-- =============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Business Reference
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Transaction Details
  amount DECIMAL(10, 2) NOT NULL, -- Positive = credit, Negative = deduction
  transaction_type TEXT NOT NULL CHECK (transaction_type IN
    ('credit_added', 'booking_deduction', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  reference_id UUID, -- booking_id or other reference
  balance_after DECIMAL(10, 2) NOT NULL CHECK (balance_after >= 0),

  -- Metadata
  created_by TEXT, -- 'system', 'admin', or user_id
  stripe_payment_intent_id TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for wallet_transactions
CREATE INDEX idx_wallet_transactions_business_id ON wallet_transactions(business_account_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_id)
  WHERE reference_id IS NOT NULL;
CREATE INDEX idx_wallet_transactions_stripe ON wallet_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- =============================================
-- TRIGGER: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_business_accounts_updated_at
  BEFORE UPDATE ON business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_bookings_updated_at
  BEFORE UPDATE ON business_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGER: Auto-generate booking number
-- =============================================
CREATE OR REPLACE FUNCTION generate_business_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                          LPAD(NEXTVAL('business_booking_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for booking numbers
CREATE SEQUENCE IF NOT EXISTS business_booking_number_seq;

-- Apply trigger
CREATE TRIGGER generate_business_booking_number_trigger
  BEFORE INSERT ON business_bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_business_booking_number();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE business_accounts IS 'Stores business/hotel/agency information with prepaid wallet balance';
COMMENT ON TABLE business_users IS 'Links Supabase auth users to business accounts (one user per business initially)';
COMMENT ON TABLE business_bookings IS 'Bookings created by businesses on behalf of their customers';
COMMENT ON TABLE wallet_transactions IS 'Complete audit trail of all wallet balance changes';

COMMENT ON COLUMN business_accounts.wallet_balance IS 'Prepaid balance used for booking payments';
COMMENT ON COLUMN business_accounts.subdomain IS 'Auto-generated subdomain (e.g., acme for acme.yourdomain.com)';
COMMENT ON COLUMN business_accounts.custom_domain IS 'Optional custom domain (e.g., transfers.acmehotel.com)';
COMMENT ON COLUMN business_bookings.wallet_deduction_amount IS 'Amount deducted from business wallet for this booking';
COMMENT ON COLUMN wallet_transactions.amount IS 'Positive for credits, negative for deductions';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Wallet balance after this transaction (for audit trail)';
