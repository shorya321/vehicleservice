-- Fix handle_new_user function by adding SET search_path = ''
-- Migration: 2025-11-06
-- Description: Adds SET search_path configuration to allow SECURITY DEFINER to bypass RLS
--              This is the ONLY change - no logic modifications
--              Fixes business signup while maintaining all existing functionality

-- =============================================
-- Fix: Add SET search_path = '' to function
-- =============================================
-- This allows SECURITY DEFINER to properly bypass RLS policies
-- The function logic remains 100% unchanged
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
    role_value,  -- Uses the determined role from metadata
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
-- ONLY CHANGE: Added "SET search_path = ''" to allow proper RLS bypass

-- =============================================
-- Migration complete
-- =============================================
-- Changes:
-- - Added SET search_path = '' to handle_new_user function
--
-- Impact:
-- - Customer signup: Still creates role='customer' (no change)
-- - Business signup: Now creates role='business' (fixed)
-- - All other signups: No change
-- - Existing functionality: 100% preserved
