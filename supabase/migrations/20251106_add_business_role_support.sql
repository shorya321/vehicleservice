-- Add 'business' role support for B2B business account signups
-- Migration: 2025-11-06
-- Description: Adds 'business' to user_role enum and updates handle_new_user trigger
--              to detect business signups via user_metadata

-- =============================================
-- Step 1: Add 'business' to user_role enum
-- =============================================
-- This is a safe operation - adds new value without affecting existing data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'business'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'business';
  END IF;
END $$;

-- =============================================
-- Step 2: Update handle_new_user trigger function
-- =============================================
-- Modified to check user_metadata for user_type
-- Defaults to 'customer' for backward compatibility
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type TEXT;
  role_value user_role;
BEGIN
  -- Extract user_type from metadata, default to 'customer'
  user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');

  -- Cast to user_role enum
  role_value := user_type::user_role;

  -- Insert profile with determined role
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    role,
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        CASE
          WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL
            AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL
          THEN ' '
          ELSE ''
        END,
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    role_value,  -- Use the determined role
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone
  WHERE profiles.first_name IS NULL OR profiles.first_name = '';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Step 3: Recreate trigger to use updated function
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Migration complete
-- =============================================
-- Notes:
-- - Existing users unaffected (no data migration)
-- - Regular signups default to 'customer' role
-- - Business signups set role='business' via user_metadata
-- - Backward compatible with all existing functionality
