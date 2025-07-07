-- Add updated_at column to vendor_applications table
ALTER TABLE vendor_applications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have updated_at = created_at
UPDATE vendor_applications 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after setting default values
ALTER TABLE vendor_applications 
ALTER COLUMN updated_at SET NOT NULL;

-- Create or replace the approve_vendor_application function
CREATE OR REPLACE FUNCTION approve_vendor_application(
  p_application_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_status TEXT;
BEGIN
  -- Get the application details
  SELECT user_id, status INTO v_user_id, v_status
  FROM vendor_applications
  WHERE id = p_application_id;

  -- Check if application exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  -- Check if already processed
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Application already processed');
  END IF;

  -- Start transaction
  BEGIN
    -- Update application status
    UPDATE vendor_applications
    SET 
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      admin_notes = p_admin_notes,
      updated_at = NOW()
    WHERE id = p_application_id;

    -- Update user role to vendor
    UPDATE profiles
    SET 
      role = 'vendor',
      updated_at = NOW()
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the reject_vendor_application function
CREATE OR REPLACE FUNCTION reject_vendor_application(
  p_application_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Get the application status
  SELECT status INTO v_status
  FROM vendor_applications
  WHERE id = p_application_id;

  -- Check if application exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  -- Check if already processed
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Application already processed');
  END IF;

  -- Update application status
  UPDATE vendor_applications
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_application_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS update_vendor_applications_updated_at ON vendor_applications;

CREATE TRIGGER update_vendor_applications_updated_at
BEFORE UPDATE ON vendor_applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION approve_vendor_application TO authenticated;
GRANT EXECUTE ON FUNCTION reject_vendor_application TO authenticated;