-- Drop the old location type enum column and type
-- All code now uses location_type_id (FK to location_types table)

-- Drop dependent functions first (order matters)
DROP FUNCTION IF EXISTS get_locations_with_booking_counts();
DROP FUNCTION IF EXISTS derive_transfer_service_code(location_type, location_type);

-- Drop the old column
ALTER TABLE locations DROP COLUMN IF EXISTS type;

-- Drop the index on the old column
DROP INDEX IF EXISTS idx_locations_type;

-- Drop the old enum type
DROP TYPE IF EXISTS location_type;
