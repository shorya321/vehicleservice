-- Create enum for location types
CREATE TYPE location_type AS ENUM ('airport', 'city', 'hotel', 'station');

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type location_type NOT NULL,
    address VARCHAR(500),
    country_code VARCHAR(2) NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    allow_pickup BOOLEAN DEFAULT true,
    allow_dropoff BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_country_code ON locations(country_code);
CREATE INDEX idx_locations_is_active ON locations(is_active);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read active locations
CREATE POLICY "Public users can view active locations"
    ON locations
    FOR SELECT
    USING (is_active = true);

-- Allow admin users to manage all locations
CREATE POLICY "Admin users can manage locations"
    ON locations
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Add comments for documentation
COMMENT ON TABLE locations IS 'Stores pickup and dropoff locations for vehicle rental services';
COMMENT ON COLUMN locations.id IS 'Unique identifier for the location';
COMMENT ON COLUMN locations.name IS 'Display name of the location';
COMMENT ON COLUMN locations.type IS 'Type of location: airport, city, hotel, or station';
COMMENT ON COLUMN locations.address IS 'Full street address of the location';
COMMENT ON COLUMN locations.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN locations.city IS 'City where the location is situated';
COMMENT ON COLUMN locations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN locations.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN locations.timezone IS 'IANA timezone identifier (e.g., Asia/Dubai)';
COMMENT ON COLUMN locations.allow_pickup IS 'Whether vehicles can be picked up from this location';
COMMENT ON COLUMN locations.allow_dropoff IS 'Whether vehicles can be dropped off at this location';
COMMENT ON COLUMN locations.is_active IS 'Whether the location is currently available for bookings';
COMMENT ON COLUMN locations.created_at IS 'Timestamp when the location was created';