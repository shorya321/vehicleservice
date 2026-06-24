-- Create routes table for managing transfer routes
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    route_name VARCHAR(255) NOT NULL,
    route_slug VARCHAR(255) UNIQUE NOT NULL,
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_route_combination UNIQUE(origin_location_id, destination_location_id),
    CONSTRAINT check_different_locations CHECK (origin_location_id != destination_location_id),
    CONSTRAINT check_positive_distance CHECK (distance_km > 0),
    CONSTRAINT check_positive_duration CHECK (estimated_duration_minutes > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_routes_origin ON routes(origin_location_id);
CREATE INDEX idx_routes_destination ON routes(destination_location_id);
CREATE INDEX idx_routes_slug ON routes(route_slug);
CREATE INDEX idx_routes_is_active ON routes(is_active);
CREATE INDEX idx_routes_is_popular ON routes(is_popular);

-- Enable Row Level Security
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routes table
CREATE POLICY "Public can view active routes"
    ON routes
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage routes"
    ON routes
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE routes IS 'Stores predefined transfer routes between locations';
COMMENT ON COLUMN routes.route_slug IS 'SEO-friendly URL slug for the route';
COMMENT ON COLUMN routes.is_popular IS 'Flag to indicate if this is a popular/featured route';

-- Create function to get popular routes based on is_popular flag
CREATE OR REPLACE FUNCTION get_popular_routes(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    route_slug VARCHAR,
    origin_location_id UUID,
    destination_location_id UUID,
    origin_name VARCHAR,
    destination_name VARCHAR,
    origin_city VARCHAR,
    destination_city VARCHAR,
    distance_km DECIMAL,
    estimated_duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.route_slug,
        r.origin_location_id,
        r.destination_location_id,
        ol.name as origin_name,
        dl.name as destination_name,
        ol.city as origin_city,
        dl.city as destination_city,
        r.distance_km,
        r.estimated_duration_minutes
    FROM routes r
    INNER JOIN locations ol ON r.origin_location_id = ol.id
    INNER JOIN locations dl ON r.destination_location_id = dl.id
    WHERE r.is_active = true AND r.is_popular = true
    ORDER BY r.route_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
