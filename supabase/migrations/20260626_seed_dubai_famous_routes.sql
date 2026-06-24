-- ============================================================
-- Seed 10 famous Dubai transfer routes between 3 zones:
-- Downtown & DIFC, Dubai Marina & JBR, Palm Jumeirah
-- Uses EXISTING locations only — no new data created
-- ============================================================

-- Step 1: Delete all existing routes
DELETE FROM routes;

-- Step 2: Insert 10 routes using existing landmark locations
-- Downtown & DIFC: burj-khalifa-dubai-3, dubai-mall-dubai, dubai-opera, difc
-- Dubai Marina & JBR: ain-dubai, marina-walk-dubai-5, dubai-marina-mall-dubai, the-walk
-- Palm Jumeirah: atlantis-the-palm, nakheel-mall, palm-jumeirah-boardwalk-dubai-2

-- Route 1: Burj Khalifa → Atlantis The Palm (Downtown → Palm)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  22.0, 25, true, true
FROM locations o, locations d
WHERE o.slug = 'burj-khalifa-dubai-3' AND d.slug = 'atlantis-the-palm';

-- Route 2: Atlantis The Palm → Burj Khalifa (Palm → Downtown)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  22.0, 25, true, true
FROM locations o, locations d
WHERE o.slug = 'atlantis-the-palm' AND d.slug = 'burj-khalifa-dubai-3';

-- Route 3: Dubai Mall → The Walk JBR (Downtown → Marina)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  14.0, 15, true, true
FROM locations o, locations d
WHERE o.slug = 'dubai-mall-dubai' AND d.slug = 'the-walk';

-- Route 4: The Walk JBR → Dubai Mall (Marina → Downtown)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  14.0, 15, true, true
FROM locations o, locations d
WHERE o.slug = 'the-walk' AND d.slug = 'dubai-mall-dubai';

-- Route 5: Marina Walk → Atlantis The Palm (Marina → Palm)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  12.0, 15, true, true
FROM locations o, locations d
WHERE o.slug = 'marina-walk-dubai-5' AND d.slug = 'atlantis-the-palm';

-- Route 6: Atlantis The Palm → Marina Walk (Palm → Marina)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  12.0, 15, true, true
FROM locations o, locations d
WHERE o.slug = 'atlantis-the-palm' AND d.slug = 'marina-walk-dubai-5';

-- Route 7: Dubai Opera → Dubai Marina Mall (Downtown → Marina)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  15.0, 18, true, true
FROM locations o, locations d
WHERE o.slug = 'dubai-opera' AND d.slug = 'dubai-marina-mall-dubai';

-- Route 8: Ain Dubai → Nakheel Mall (Marina → Palm)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  11.0, 14, true, true
FROM locations o, locations d
WHERE o.slug = 'ain-dubai' AND d.slug = 'nakheel-mall';

-- Route 9: Nakheel Mall → DIFC (Palm → Downtown)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  20.0, 22, true, true
FROM locations o, locations d
WHERE o.slug = 'nakheel-mall' AND d.slug = 'difc';

-- Route 10: DIFC → Ain Dubai (Downtown → Marina)
INSERT INTO routes (origin_location_id, destination_location_id, route_name, route_slug, distance_km, estimated_duration_minutes, is_active, is_popular)
SELECT o.id, d.id, o.name || ' to ' || d.name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o.slug || '-to-' || d.slug, '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')),
  16.0, 18, true, true
FROM locations o, locations d
WHERE o.slug = 'difc' AND d.slug = 'ain-dubai';
