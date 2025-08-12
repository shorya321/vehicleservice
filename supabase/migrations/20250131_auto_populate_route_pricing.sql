-- Function to calculate vehicle type price based on base price and vehicle type
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

-- Function to populate pricing for a single route
CREATE OR REPLACE FUNCTION populate_route_pricing(route_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert pricing for all active vehicle types for this route
  INSERT INTO route_vehicle_type_pricing (route_id, vehicle_type_id, price)
  SELECT 
    route_id,
    vt.id AS vehicle_type_id,
    calculate_vehicle_type_price(r.base_price, vt.slug) AS price
  FROM routes r
  CROSS JOIN vehicle_types vt
  WHERE r.id = route_id
    AND r.is_active = true
    AND vt.is_active = true
  ON CONFLICT (route_id, vehicle_type_id) DO UPDATE SET
    price = EXCLUDED.price,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-populate pricing when a route is created
CREATE OR REPLACE FUNCTION auto_populate_route_pricing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only populate for active routes
  IF NEW.is_active = true THEN
    PERFORM populate_route_pricing(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new routes
DROP TRIGGER IF EXISTS trigger_auto_populate_route_pricing ON routes;
CREATE TRIGGER trigger_auto_populate_route_pricing
  AFTER INSERT ON routes
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_route_pricing();

-- Also trigger when a route is activated
DROP TRIGGER IF EXISTS trigger_update_route_pricing ON routes;
CREATE TRIGGER trigger_update_route_pricing
  AFTER UPDATE ON routes
  FOR EACH ROW
  WHEN (OLD.is_active = false AND NEW.is_active = true)
  EXECUTE FUNCTION auto_populate_route_pricing();

-- Populate pricing for all existing active routes that don't have pricing yet
DO $$
DECLARE
  route_record RECORD;
BEGIN
  FOR route_record IN 
    SELECT r.id 
    FROM routes r
    WHERE r.is_active = true
      AND NOT EXISTS (
        SELECT 1 
        FROM route_vehicle_type_pricing rvtp
        WHERE rvtp.route_id = r.id
      )
  LOOP
    PERFORM populate_route_pricing(route_record.id);
  END LOOP;
END $$;

-- Also ensure all existing routes have pricing for all vehicle types
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

-- Add comment to explain the auto-population
COMMENT ON FUNCTION populate_route_pricing(UUID) IS 'Populates vehicle type pricing for a given route based on base price and vehicle type multipliers';
COMMENT ON TRIGGER trigger_auto_populate_route_pricing ON routes IS 'Automatically populates vehicle type pricing when a new route is created';
COMMENT ON TRIGGER trigger_update_route_pricing ON routes IS 'Automatically populates vehicle type pricing when a route is activated';