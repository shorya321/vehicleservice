-- Fix handle_new_user function to match actual profiles table schema
-- Migration: 2025-11-06
-- Description: Remove first_name and last_name columns that don't exist in profiles table
--              This fixes ALL signups (customer, business, vendor, etc.)

-- =============================================
-- Fix: Remove non-existent columns from trigger
-- =============================================
-- The profiles table only has: id, email, full_name, phone, role, status
-- Remove references to first_name and last_name

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type TEXT;
  role_value public.user_role;
BEGIN
  -- Extract user_type from metadata, default to 'customer'
  user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');

  -- Cast to user_role enum (must use fully qualified name with empty search_path)
  role_value := user_type::public.user_role;

  -- Insert profile with determined role
  -- Only using columns that actually exist in profiles table
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
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
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    role_value,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone
  WHERE public.profiles.full_name IS NULL OR public.profiles.full_name = '';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =============================================
-- Migration complete
-- =============================================
-- Changes:
-- - Removed first_name and last_name from INSERT column list
-- - Removed first_name and last_name from VALUES list
-- - Removed first_name and last_name from ON CONFLICT UPDATE
-- - Kept all business role logic intact
-- - Kept SET search_path = '' security configuration
--
-- Impact:
-- - Customer signup: Works (role='customer')
-- - Business signup: Works (role='business')
-- - All other signups: Work
-- - No breaking changes to existing functionality
