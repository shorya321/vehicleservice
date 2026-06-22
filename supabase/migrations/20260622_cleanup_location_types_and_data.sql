-- ============================================================
-- Phase 1: Deactivate noise location types, fix popular
-- locations, and update sort order for transfer-relevant types
-- ============================================================

-- 1. Deactivate location types irrelevant for transfer/taxi service
-- These generate noise in search results (bakeries, car washes, etc.)
UPDATE location_types SET is_active = false WHERE name IN (
  'restaurant',
  'cafe',
  'bakery',
  'bar',
  'car_repair',
  'car_wash',
  'car_dealer',
  'car_rental',
  'beauty_salon',
  'gym',
  'spa',
  'pharmacy',
  'bank',
  'electronics_store',
  'clothing_store',
  'jewelry_store',
  'furniture_store',
  'pet_store',
  'supermarket',
  'convenience_store',
  'laundry',
  'gas_station',
  'school',
  'post_office',
  'library',
  'movie_theater',
  'travel_agency',
  'other'
);

-- 2. Update sort order so transfer-relevant types appear in logical order
-- Transport first, then accommodation, then destinations
UPDATE location_types SET sort_order = CASE name
  -- Transport (1-10)
  WHEN 'airport' THEN 1
  WHEN 'metro_station' THEN 2
  WHEN 'bus_station' THEN 3
  WHEN 'tram_station' THEN 4
  WHEN 'transport_hub' THEN 5
  WHEN 'marina' THEN 6
  -- Accommodation (10-15)
  WHEN 'hotel' THEN 10
  WHEN 'resort' THEN 11
  -- City/Region (20)
  WHEN 'city' THEN 20
  -- Landmarks & Attractions (30-50)
  WHEN 'tourist_attraction' THEN 30
  WHEN 'shopping_mall' THEN 31
  WHEN 'theme_park' THEN 32
  WHEN 'museum' THEN 33
  WHEN 'beach' THEN 34
  WHEN 'park' THEN 35
  WHEN 'aquarium' THEN 36
  WHEN 'zoo' THEN 37
  WHEN 'entertainment_venue' THEN 38
  WHEN 'event_venue' THEN 39
  WHEN 'exhibition_center' THEN 40
  WHEN 'art_gallery' THEN 41
  WHEN 'golf_club' THEN 42
  -- Important Places (50-60)
  WHEN 'hospital' THEN 50
  WHEN 'university' THEN 51
  WHEN 'embassy' THEN 52
  WHEN 'mosque' THEN 53
  WHEN 'church' THEN 54
  WHEN 'hindu_temple' THEN 55
  ELSE sort_order
END
WHERE is_active = true;

-- 3. Fix popular locations: remove Indian cities
UPDATE locations SET is_popular = false
WHERE is_popular = true
AND name IN ('Jassur', 'Manwal', 'Pathankot');

-- 4. Clean up broken alias mappings
-- Delete aliases that point to wrong locations (mosques, schools, dog parks)
DELETE FROM location_aliases
WHERE id IN (
  -- DWC aliases pointing to non-airport locations
  SELECT la.id FROM location_aliases la
  JOIN locations l ON l.id = la.location_id
  JOIN location_types lt ON lt.id = l.location_type_id
  WHERE la.alias = 'DWC' AND lt.name != 'airport'
  UNION ALL
  -- DXB aliases pointing to non-airport locations
  SELECT la.id FROM location_aliases la
  JOIN locations l ON l.id = la.location_id
  JOIN location_types lt ON lt.id = l.location_type_id
  WHERE la.alias = 'DXB' AND lt.name != 'airport'
  UNION ALL
  -- MOE aliases pointing to non-shopping-mall locations
  SELECT la.id FROM location_aliases la
  JOIN locations l ON l.id = la.location_id
  JOIN location_types lt ON lt.id = l.location_type_id
  WHERE la.alias = 'MOE' AND lt.name != 'shopping_mall'
  UNION ALL
  -- JBR aliases pointing to irrelevant locations (dog parks, security offices)
  SELECT la.id FROM location_aliases la
  JOIN locations l ON l.id = la.location_id
  WHERE la.alias = 'JBR'
  AND l.name NOT ILIKE '%jumeirah beach residen%'
  AND l.name NOT ILIKE '%JBR%'
);
