-- Route photography for the home page Routes rail.
--
-- The rail's cards open with a media plate. Nothing in the schema carried an
-- image for a route: locations has none either, and the only image columns in
-- the database belong to vehicles, vehicle_types, vehicle_categories and the
-- blog tables. The image belongs on the route row rather than on the location,
-- because the corridors are landmark-to-landmark and a photo of the destination
-- alone does not describe the journey.
--
-- image_alt ships in the same migration rather than a later one: without it the
-- alt text is forced to a generated "X to Y" string for every photo.
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT;

-- get_popular_routes gains the two columns.
--
-- CREATE OR REPLACE cannot change a RETURNS TABLE shape, and the DEFAULT on
-- limit_count creates a callable zero-arg signature as well, so both are
-- dropped first. app/actions.ts calls the zero-arg form.
DROP FUNCTION IF EXISTS get_popular_routes(INTEGER);
DROP FUNCTION IF EXISTS get_popular_routes();

CREATE FUNCTION get_popular_routes(
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
    estimated_duration_minutes INTEGER,
    image_url TEXT,
    image_alt TEXT
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
        r.estimated_duration_minutes,
        r.image_url,
        r.image_alt
    FROM routes r
    INNER JOIN locations ol ON r.origin_location_id = ol.id
    INNER JOIN locations dl ON r.destination_location_id = dl.id
    WHERE r.is_active = true AND r.is_popular = true
    ORDER BY r.route_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
