-- Consolidate vendor data into vendor_applications table
-- This migration removes business_profiles table and uses vendor_applications as single source of truth

-- Step 1: Add operating_hours to vendor_applications
ALTER TABLE public.vendor_applications 
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';

-- Step 2: Migrate any existing operating_hours data from business_profiles to vendor_applications
UPDATE public.vendor_applications va
SET operating_hours = bp.operating_hours
FROM public.business_profiles bp
WHERE bp.vendor_id = va.user_id
AND bp.operating_hours IS NOT NULL
AND bp.operating_hours != '{}';

-- Step 3: Update vehicles table to reference vendor_applications instead of business_profiles
-- First, add new column for vendor_id
ALTER TABLE public.vehicles 
ADD COLUMN vendor_id UUID REFERENCES public.vendor_applications(user_id) ON DELETE CASCADE;

-- Migrate existing business_id to vendor_id
UPDATE public.vehicles v
SET vendor_id = bp.vendor_id
FROM public.business_profiles bp
WHERE v.business_id = bp.id;

-- Make vendor_id NOT NULL after migration
ALTER TABLE public.vehicles 
ALTER COLUMN vendor_id SET NOT NULL;

-- Drop the old business_id column and its constraint
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_business_id_fkey,
DROP COLUMN business_id;

-- Step 4: Update RLS policies on vehicles table
-- Drop existing policies that reference business_profiles
DROP POLICY IF EXISTS "Vendors can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Vendors can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Vendors can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Vendors can delete own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Customers can view available vehicles" ON public.vehicles;

-- Create new policies that reference vendor_applications
CREATE POLICY "Vendors can view own vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert own vehicles" 
  ON public.vehicles 
  FOR INSERT 
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (vendor_id = auth.uid());

-- Admins can manage all vehicles
CREATE POLICY "Admins can manage all vehicles" 
  ON public.vehicles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Customers can view available vehicles from approved vendors
CREATE POLICY "Customers can view available vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (
    is_available = true 
    AND EXISTS (
      SELECT 1 FROM public.vendor_applications 
      WHERE vendor_applications.user_id = vehicles.vendor_id 
      AND vendor_applications.status = 'approved'
    )
  );

-- Step 5: Update approve_vendor_application function to not create business_profiles
CREATE OR REPLACE FUNCTION public.approve_vendor_application(
  p_application_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_business_data RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Get application data
  SELECT 
    user_id,
    business_name,
    business_email,
    business_phone,
    business_address,
    business_city,
    business_country_code,
    business_description
  INTO v_business_data
  FROM public.vendor_applications
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Application not found or already processed');
  END IF;

  v_user_id := v_business_data.user_id;

  -- Start transaction
  BEGIN
    -- Update application status
    UPDATE public.vendor_applications
    SET 
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      admin_notes = p_admin_notes
    WHERE id = p_application_id;

    -- Update user role to vendor
    UPDATE public.profiles
    SET 
      role = 'vendor',
      updated_at = NOW()
    WHERE id = v_user_id;

    -- Log activity
    INSERT INTO public.user_activity_logs (
      user_id,
      action,
      details,
      created_by
    ) VALUES (
      v_user_id,
      'vendor_application_approved',
      json_build_object(
        'application_id', p_application_id,
        'admin_notes', p_admin_notes
      ),
      auth.uid()
    );

    RETURN json_build_object('success', true);
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RETURN json_build_object('error', SQLERRM);
  END;
END;
$$;

-- Step 6: Update indexes
-- Drop old indexes on business_profiles (will be dropped with table)
-- Add index on vendor_applications for vendor queries
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id_status 
ON public.vendor_applications(user_id, status);

-- Step 7: Drop business_profiles table
DROP TABLE IF EXISTS public.business_profiles CASCADE;

-- Step 8: Add comment to document the operating_hours structure
COMMENT ON COLUMN public.vendor_applications.operating_hours IS 
'Operating hours in JSONB format: {"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {...}, ...}';