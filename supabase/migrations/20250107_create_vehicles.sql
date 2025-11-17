-- Create vehicles table for rental listings
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Vehicle Information
  make TEXT NOT NULL,           -- Toyota, Honda, etc.
  model TEXT NOT NULL,          -- Camry, Civic, etc.
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  registration_number TEXT UNIQUE NOT NULL,
  
  -- Rental Information
  daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate > 0),
  is_available BOOLEAN DEFAULT true,
  
  -- Vehicle Details
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  seats INTEGER CHECK (seats > 0 AND seats <= 20),
  
  -- Images
  primary_image_url TEXT,
  gallery_images JSONB DEFAULT '[]', -- Array of image URLs
  
  -- Additional Features
  features JSONB DEFAULT '[]', -- Array of features like "GPS", "Bluetooth", etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicles

-- Vendors can view and manage their own vehicles
CREATE POLICY "Vendors can view own vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE business_profiles.id = vehicles.business_id 
      AND business_profiles.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert own vehicles" 
  ON public.vehicles 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE business_profiles.id = vehicles.business_id 
      AND business_profiles.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE business_profiles.id = vehicles.business_id 
      AND business_profiles.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE business_profiles.id = vehicles.business_id 
      AND business_profiles.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete own vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE business_profiles.id = vehicles.business_id 
      AND business_profiles.vendor_id = auth.uid()
    )
  );

-- Admins can manage all vehicles
CREATE POLICY "Admins can view all vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Customers can view available vehicles from active businesses
CREATE POLICY "Customers can view available vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (
    is_available = true 
    AND EXISTS (
      SELECT 1 FROM public.business_profiles 
      WHERE business_profiles.id = vehicles.business_id 
      AND business_profiles.is_active = true
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_vehicles_updated_at 
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vehicles_business_id ON public.vehicles(business_id);
CREATE INDEX idx_vehicles_is_available ON public.vehicles(is_available);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicles_daily_rate ON public.vehicles(daily_rate);

-- Create a view for available vehicles with business info
CREATE VIEW public.available_vehicles_with_business AS
SELECT 
  v.*,
  b.business_name,
  b.business_phone,
  b.city as business_city,
  b.is_verified as business_verified
FROM public.vehicles v
JOIN public.business_profiles b ON v.business_id = b.id
WHERE v.is_available = true 
  AND b.is_active = true;