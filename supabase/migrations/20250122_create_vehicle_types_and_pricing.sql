-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  passenger_capacity INT NOT NULL,
  luggage_capacity INT DEFAULT 2,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create route_vehicle_type_pricing table
CREATE TABLE IF NOT EXISTS route_vehicle_type_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  vehicle_type_id UUID REFERENCES vehicle_types(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_id, vehicle_type_id)
);

-- Add vehicle_type_id and luggage_capacity to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS vehicle_type_id UUID REFERENCES vehicle_types(id),
ADD COLUMN IF NOT EXISTS luggage_capacity INT DEFAULT 2;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_types_category_id ON vehicle_types(category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_types_slug ON vehicle_types(slug);
CREATE INDEX IF NOT EXISTS idx_route_pricing_route_id ON route_vehicle_type_pricing(route_id);
CREATE INDEX IF NOT EXISTS idx_route_pricing_vehicle_type_id ON route_vehicle_type_pricing(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON vehicles(vehicle_type_id);

-- Add RLS policies for vehicle_types
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle types are viewable by everyone"
  ON vehicle_types FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert vehicle types"
  ON vehicle_types FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update vehicle types"
  ON vehicle_types FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete vehicle types"
  ON vehicle_types FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add RLS policies for route_vehicle_type_pricing
ALTER TABLE route_vehicle_type_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Route pricing is viewable by everyone"
  ON route_vehicle_type_pricing FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage route pricing"
  ON route_vehicle_type_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicle_types_updated_at BEFORE UPDATE
  ON vehicle_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_pricing_updated_at BEFORE UPDATE
  ON route_vehicle_type_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();