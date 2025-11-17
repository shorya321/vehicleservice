-- Function to calculate vehicle type pricing based on base price and type
CREATE OR REPLACE FUNCTION calculate_vehicle_type_price(
  base_price DECIMAL,
  vehicle_type_slug VARCHAR
) RETURNS DECIMAL AS $$
BEGIN
  -- Pricing multipliers based on vehicle type
  CASE vehicle_type_slug
    WHEN 'micro' THEN RETURN base_price * 0.7;
    WHEN 'economy-sedan' THEN RETURN base_price * 1.0;
    WHEN 'comfort-sedan' THEN RETURN base_price * 1.3;
    WHEN 'minivan-4pax' THEN RETURN base_price * 1.3;
    WHEN 'suv' THEN RETURN base_price * 1.5;
    WHEN 'minibus-7pax' THEN RETURN base_price * 1.8;
    WHEN 'minibus-10pax' THEN RETURN base_price * 2.5;
    WHEN 'minibus-13pax' THEN RETURN base_price * 3.5;
    WHEN 'minibus-16pax' THEN RETURN base_price * 4.5;
    WHEN 'minibus-19pax' THEN RETURN base_price * 5.5;
    WHEN 'luxury-sedan' THEN RETURN base_price * 2.0;
    WHEN 'luxury-suv' THEN RETURN base_price * 2.5;
    ELSE RETURN base_price;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Populate route_vehicle_type_pricing for all existing routes
INSERT INTO route_vehicle_type_pricing (route_id, vehicle_type_id, price)
SELECT 
  r.id AS route_id,
  vt.id AS vehicle_type_id,
  calculate_vehicle_type_price(r.base_price, vt.slug) AS price
FROM routes r
CROSS JOIN vehicle_types vt
WHERE r.is_active = true
AND vt.is_active = true
ON CONFLICT (route_id, vehicle_type_id) DO UPDATE SET
  price = EXCLUDED.price,
  updated_at = NOW();

-- Update vendor_route_services to remove price_multiplier dependency
-- Vendors will now compete on service quality rather than price manipulation
ALTER TABLE vendor_route_services 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS service_features JSONB DEFAULT '{}';

-- Add comments to clarify the new pricing model
COMMENT ON TABLE route_vehicle_type_pricing IS 'Stores fixed prices for each vehicle type on each route';
COMMENT ON COLUMN route_vehicle_type_pricing.price IS 'Fixed price for this vehicle type on this route';
COMMENT ON TABLE vendor_route_services IS 'Tracks which vendors service which routes';
COMMENT ON COLUMN vendor_route_services.price_multiplier IS 'DEPRECATED - Use route_vehicle_type_pricing instead';

-- Drop the function after use
DROP FUNCTION IF EXISTS calculate_vehicle_type_price(DECIMAL, VARCHAR);