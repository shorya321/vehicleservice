-- Create routes table for managing transfer routes
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    route_name VARCHAR(255) NOT NULL,
    route_slug VARCHAR(255) UNIQUE NOT NULL,
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_route_combination UNIQUE(origin_location_id, destination_location_id),
    CONSTRAINT check_different_locations CHECK (origin_location_id != destination_location_id),
    CONSTRAINT check_positive_distance CHECK (distance_km > 0),
    CONSTRAINT check_positive_duration CHECK (estimated_duration_minutes > 0),
    CONSTRAINT check_positive_price CHECK (base_price >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_routes_origin ON routes(origin_location_id);
CREATE INDEX idx_routes_destination ON routes(destination_location_id);
CREATE INDEX idx_routes_slug ON routes(route_slug);
CREATE INDEX idx_routes_is_active ON routes(is_active);
CREATE INDEX idx_routes_is_popular ON routes(is_popular);

-- Create route_searches table for tracking search analytics
CREATE TABLE IF NOT EXISTS route_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    destination_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    searched_at TIMESTAMPTZ DEFAULT NOW(),
    search_date DATE DEFAULT CURRENT_DATE
);

-- Create indexes for analytics queries
CREATE INDEX idx_route_searches_date ON route_searches(search_date);
CREATE INDEX idx_route_searches_route ON route_searches(route_id);
CREATE INDEX idx_route_searches_locations ON route_searches(origin_location_id, destination_location_id);

-- Create vendor_route_services table for vendor route assignments
CREATE TABLE IF NOT EXISTS vendor_route_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_applications(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    price_multiplier DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vendor_route UNIQUE(vendor_id, route_id),
    CONSTRAINT check_price_multiplier CHECK (price_multiplier >= 0.1 AND price_multiplier <= 10.0)
);

-- Create indexes
CREATE INDEX idx_vendor_route_services_vendor ON vendor_route_services(vendor_id);
CREATE INDEX idx_vendor_route_services_route ON vendor_route_services(route_id);
CREATE INDEX idx_vendor_route_services_active ON vendor_route_services(is_active);

-- Enable Row Level Security
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_route_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routes table
-- Allow everyone to view active routes
CREATE POLICY "Public can view active routes"
    ON routes
    FOR SELECT
    USING (is_active = true);

-- Allow admins to manage all routes
CREATE POLICY "Admins can manage routes"
    ON routes
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for route_searches table
-- Allow inserting searches for everyone (including anonymous)
CREATE POLICY "Anyone can create route searches"
    ON route_searches
    FOR INSERT
    WITH CHECK (true);

-- Allow users to view their own searches
CREATE POLICY "Users can view own searches"
    ON route_searches
    FOR SELECT
    USING (
        user_id = auth.uid() OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- RLS Policies for vendor_route_services table
-- Allow vendors to view their own route services
CREATE POLICY "Vendors can view own route services"
    ON vendor_route_services
    FOR SELECT
    USING (
        vendor_id IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid()
        ) OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Allow vendors to manage their own route services
CREATE POLICY "Vendors can manage own route services"
    ON vendor_route_services
    FOR ALL
    USING (
        vendor_id IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid() AND status = 'approved'
        ) OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_route_services_updated_at BEFORE UPDATE ON vendor_route_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE routes IS 'Stores predefined transfer routes between locations';
COMMENT ON TABLE route_searches IS 'Tracks route searches for analytics and popularity tracking';
COMMENT ON TABLE vendor_route_services IS 'Maps which routes each vendor provides service for';

COMMENT ON COLUMN routes.route_slug IS 'SEO-friendly URL slug for the route';
COMMENT ON COLUMN routes.base_price IS 'Base price for the route, actual price may vary by vehicle category and vendor';
COMMENT ON COLUMN routes.is_popular IS 'Flag to indicate if this is a popular/featured route';

COMMENT ON COLUMN vendor_route_services.price_multiplier IS 'Vendor-specific price adjustment (1.0 = base price, 1.5 = 50% more, etc)';

-- Create function to get popular routes based on search frequency
CREATE OR REPLACE FUNCTION get_popular_routes(
    limit_count INTEGER DEFAULT 10,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    route_id UUID,
    route_name VARCHAR,
    route_slug VARCHAR,
    origin_name VARCHAR,
    destination_name VARCHAR,
    search_count BIGINT,
    base_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as route_id,
        r.route_name,
        r.route_slug,
        ol.name as origin_name,
        dl.name as destination_name,
        COUNT(rs.id) as search_count,
        r.base_price
    FROM routes r
    INNER JOIN locations ol ON r.origin_location_id = ol.id
    INNER JOIN locations dl ON r.destination_location_id = dl.id
    LEFT JOIN route_searches rs ON r.id = rs.route_id
        AND rs.searched_at >= NOW() - INTERVAL '1 day' * days_back
    WHERE r.is_active = true
    GROUP BY r.id, r.route_name, r.route_slug, ol.name, dl.name, r.base_price
    ORDER BY COUNT(rs.id) DESC, r.route_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;