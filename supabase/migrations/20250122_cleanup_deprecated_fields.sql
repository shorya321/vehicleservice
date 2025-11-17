-- Remove deprecated price_multiplier field from vendor_route_services
-- We now use route_vehicle_type_pricing for fixed prices per vehicle type
ALTER TABLE vendor_route_services 
DROP COLUMN IF EXISTS price_multiplier;

-- Remove deprecated daily_rate from vehicles since pricing is route-based
ALTER TABLE vehicles
DROP COLUMN IF EXISTS daily_rate;

-- Add index for better performance on route_vehicle_type_pricing queries
CREATE INDEX IF NOT EXISTS idx_route_vehicle_type_pricing_route_vehicle 
ON route_vehicle_type_pricing(route_id, vehicle_type_id);

-- Add index for vehicle type lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type 
ON vehicles(vehicle_type_id) WHERE is_available = true;