-- Create business profiles table for vendors
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Basic Business Information
  business_name TEXT NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  country_code TEXT DEFAULT 'AE',
  
  -- Business Details
  description TEXT,
  logo_url TEXT,
  
  -- Operating Info
  operating_hours JSONB DEFAULT '{}', -- {"monday": {"open": "09:00", "close": "18:00"}, ...}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_profiles

-- Vendors can view and update their own business profile
CREATE POLICY "Vendors can view own business profile" 
  ON public.business_profiles 
  FOR SELECT 
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert own business profile" 
  ON public.business_profiles 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = vendor_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'vendor'
    )
  );

CREATE POLICY "Vendors can update own business profile" 
  ON public.business_profiles 
  FOR UPDATE 
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Admins can view and manage all business profiles
CREATE POLICY "Admins can view all business profiles" 
  ON public.business_profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all business profiles" 
  ON public.business_profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Customers can view active and verified business profiles
CREATE POLICY "Customers can view active business profiles" 
  ON public.business_profiles 
  FOR SELECT 
  USING (is_active = true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_business_profiles_updated_at 
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_business_profiles_vendor_id ON public.business_profiles(vendor_id);
CREATE INDEX idx_business_profiles_is_active ON public.business_profiles(is_active);
CREATE INDEX idx_business_profiles_city ON public.business_profiles(city);