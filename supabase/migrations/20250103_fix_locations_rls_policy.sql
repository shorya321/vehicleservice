-- Fix RLS policy for locations table to properly check admin role

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admin users can manage locations" ON locations;

-- Create the correct policy that checks role in profiles table
CREATE POLICY "Admin users can manage locations"
  ON locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Also add a WITH CHECK clause for INSERT and UPDATE operations
DROP POLICY IF EXISTS "Admin users can manage locations" ON locations;

CREATE POLICY "Admin users can manage locations"
  ON locations
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