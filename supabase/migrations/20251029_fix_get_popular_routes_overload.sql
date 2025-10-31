-- Fix function overloading error for get_popular_routes
-- Drop all versions of the function to resolve ambiguity

-- Drop all possible overload versions
DROP FUNCTION IF EXISTS get_popular_routes();
DROP FUNCTION IF EXISTS get_popular_routes(INTEGER);
DROP FUNCTION IF EXISTS get_popular_routes(limit_count INTEGER);
DROP FUNCTION IF EXISTS get_popular_routes(limit_count INTEGER, days_back INTEGER);

-- Recreate single canonical version
-- Uses is_popular flag instead of route_searches table for better performance
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
    base_price DECIMAL,
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
        r.base_price,
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
