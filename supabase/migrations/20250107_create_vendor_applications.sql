-- Create vendor applications table
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Business Information
  business_name TEXT NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  business_city TEXT,
  business_country_code TEXT DEFAULT 'AE',
  business_description TEXT,
  
  -- Application Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps and Review Info
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  
  -- Ensure one application per user
  CONSTRAINT one_application_per_user UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view their own application
CREATE POLICY "Users can view own vendor application" 
  ON public.vendor_applications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own application (only if they don't have one already)
CREATE POLICY "Users can create vendor application" 
  ON public.vendor_applications 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.vendor_applications 
      WHERE vendor_applications.user_id = auth.uid()
    )
  );

-- Users can update their own application (only if it's rejected)
CREATE POLICY "Users can update rejected application" 
  ON public.vendor_applications 
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'rejected')
  WITH CHECK (auth.uid() = user_id AND status = 'rejected');

-- Admins can view all applications
CREATE POLICY "Admins can view all vendor applications" 
  ON public.vendor_applications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all applications
CREATE POLICY "Admins can update all vendor applications" 
  ON public.vendor_applications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_vendor_applications_updated_at 
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX idx_vendor_applications_created_at ON public.vendor_applications(created_at DESC);

-- Create a function to approve vendor application
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

    -- Create business profile
    INSERT INTO public.business_profiles (
      vendor_id,
      business_name,
      business_email,
      business_phone,
      address,
      city,
      country_code,
      description
    ) VALUES (
      v_user_id,
      v_business_data.business_name,
      v_business_data.business_email,
      v_business_data.business_phone,
      v_business_data.business_address,
      v_business_data.business_city,
      v_business_data.business_country_code,
      v_business_data.business_description
    );

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

-- Create a function to reject vendor application
CREATE OR REPLACE FUNCTION public.reject_vendor_application(
  p_application_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Update application
  UPDATE public.vendor_applications
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes
  WHERE id = p_application_id AND status = 'pending'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Application not found or already processed');
  END IF;

  -- Log activity
  INSERT INTO public.user_activity_logs (
    user_id,
    action,
    details,
    created_by
  ) VALUES (
    v_user_id,
    'vendor_application_rejected',
    json_build_object(
      'application_id', p_application_id,
      'rejection_reason', p_rejection_reason,
      'admin_notes', p_admin_notes
    ),
    auth.uid()
  );

  RETURN json_build_object('success', true);
END;
$$;