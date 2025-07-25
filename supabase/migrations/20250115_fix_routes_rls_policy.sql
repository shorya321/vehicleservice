-- Fix RLS policy for routes table to properly check admin role

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins can manage routes" ON routes;

-- Create the correct policy that checks role in profiles table
CREATE POLICY "Admins can manage routes"
  ON routes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Fix RLS policy for vendor_route_services table as well
DROP POLICY IF EXISTS "Vendors can view own route services" ON vendor_route_services;
DROP POLICY IF EXISTS "Vendors can manage own route services" ON vendor_route_services;

-- Create correct policies for vendor_route_services
CREATE POLICY "Vendors can view own route services"
  ON vendor_route_services
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendor_applications 
      WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can manage own route services"
  ON vendor_route_services
  FOR ALL
  USING (
    vendor_id IN (
      SELECT id FROM vendor_applications 
      WHERE user_id = auth.uid() AND status = 'approved'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_applications 
      WHERE user_id = auth.uid() AND status = 'approved'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Fix RLS policy for route_searches table
DROP POLICY IF EXISTS "Users can view own searches" ON route_searches;

CREATE POLICY "Users can view own searches"
  ON route_searches
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );