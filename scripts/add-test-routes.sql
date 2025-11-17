-- Add popular routes between major cities
-- First, get the location IDs for creating routes
WITH location_ids AS (
  SELECT 
    id,
    name,
    city
  FROM locations
  WHERE is_active = true
)

-- Insert popular routes
INSERT INTO routes (
  origin_location_id,
  destination_location_id,
  route_name,
  route_slug,
  distance_km,
  estimated_duration_minutes,
  is_active,
  is_popular
)
SELECT
  o.id as origin_location_id,
  d.id as destination_location_id,
  CONCAT(o.city, ' to ', d.city) as route_name,
  LOWER(REPLACE(CONCAT(o.city, '-to-', d.city), ' ', '-')) as route_slug,
  distance_km,
  duration_minutes,
  true as is_active,
  is_popular
FROM (
  VALUES
    -- Delhi to Mumbai routes
    ('Indira Gandhi International Airport', 'Chhatrapati Shivaji International Airport', 1400, 1200, true),
    ('Delhi Railway Station', 'Mumbai Central Railway Station', 1380, 1260, true),
    ('Connaught Place', 'Bandra', 1420, 1320, true),

    -- Delhi to Bangalore routes
    ('Indira Gandhi International Airport', 'Kempegowda International Airport', 2150, 1800, true),
    ('Delhi Railway Station', 'Bangalore City Railway Station', 2120, 1860, false),

    -- Mumbai to Bangalore routes
    ('Chhatrapati Shivaji International Airport', 'Kempegowda International Airport', 980, 840, true),
    ('Mumbai Central Railway Station', 'Electronic City', 990, 900, false),

    -- Delhi to Jaipur routes
    ('Indira Gandhi International Airport', 'Jaipur International Airport', 270, 300, true),
    ('Delhi Railway Station', 'Jaipur Railway Station', 280, 330, true),

    -- Mumbai to Pune routes
    ('Chhatrapati Shivaji International Airport', 'Pune Airport', 150, 180, true),
    ('Mumbai Central Railway Station', 'Pune Railway Station', 155, 210, true),
    ('Bandra', 'Pune Railway Station', 145, 190, false),

    -- Delhi to Gurgaon routes
    ('Indira Gandhi International Airport', 'Gurgaon', 25, 35, true),
    ('Delhi Railway Station', 'Gurgaon', 30, 45, false),

    -- Bangalore to Chennai routes
    ('Kempegowda International Airport', 'Chennai International Airport', 350, 360, true),
    ('Bangalore City Railway Station', 'Chennai Central Railway Station', 345, 390, false),

    -- Mumbai to Goa routes
    ('Chhatrapati Shivaji International Airport', 'Goa International Airport', 450, 480, true),
    ('Mumbai Central Railway Station', 'Madgaon Railway Station', 460, 540, false),

    -- Delhi to Agra routes (if Agra locations exist)
    ('Delhi Railway Station', 'Delhi Railway Station', 0, 0, false) -- Dummy entry, remove this
) AS route_data(origin_name, destination_name, distance_km, duration_minutes, is_popular)
JOIN location_ids o ON o.name = route_data.origin_name
JOIN location_ids d ON d.name = route_data.destination_name
WHERE o.id != d.id -- Ensure we don't create routes from a location to itself
ON CONFLICT (origin_location_id, destination_location_id) DO NOTHING;