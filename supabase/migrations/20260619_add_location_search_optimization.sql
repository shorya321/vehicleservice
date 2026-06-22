-- ============================================================
-- Location Search Optimization
-- Adds trigram indexes for fast substring search,
-- is_popular flag, and search/popular RPC functions
-- ============================================================

-- 1. Enable pg_trgm extension for fuzzy/substring matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN trigram indexes for fast ILIKE / similarity() on name and city
CREATE INDEX idx_locations_name_trgm ON locations USING GIN(name gin_trgm_ops);
CREATE INDEX idx_locations_city_trgm ON locations USING GIN(city gin_trgm_ops);

-- 3. Add is_popular flag for curated popular destinations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_locations_is_popular ON locations(is_popular) WHERE is_popular = true;

-- 4. Search locations RPC with relevance ranking
CREATE OR REPLACE FUNCTION search_locations(
  search_query TEXT,
  result_limit INT DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  country_code TEXT,
  slug TEXT,
  country_slug TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  location_type_id UUID,
  location_type_label TEXT,
  location_type_icon TEXT,
  location_type_sort INT,
  allow_pickup BOOLEAN,
  allow_dropoff BOOLEAN,
  relevance FLOAT4
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  normalized_query := lower(trim(search_query));

  IF length(normalized_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.name::TEXT,
    l.address::TEXT,
    l.city::TEXT,
    l.country_code::TEXT,
    l.slug::TEXT,
    l.country_slug::TEXT,
    l.latitude::FLOAT8,
    l.longitude::FLOAT8,
    l.location_type_id,
    lt.label::TEXT,
    lt.icon_name::TEXT,
    lt.sort_order,
    l.allow_pickup,
    l.allow_dropoff,
    CASE
      WHEN lower(l.name) = normalized_query THEN 1.0
      WHEN lower(l.name) LIKE normalized_query || '%' THEN 0.9
      WHEN lower(l.city) = normalized_query THEN 0.85
      WHEN lower(l.city) LIKE normalized_query || '%' THEN 0.8
      ELSE GREATEST(
        public.similarity(l.name, search_query),
        public.similarity(COALESCE(l.city, ''), search_query)
      )
    END::FLOAT4
  FROM public.locations l
  JOIN public.location_types lt ON lt.id = l.location_type_id
  WHERE l.is_active = true
    AND lt.is_active = true
    AND (
      l.name ILIKE '%' || normalized_query || '%'
      OR l.city ILIKE '%' || normalized_query || '%'
      OR public.similarity(l.name, search_query) > 0.2
    )
  ORDER BY 16 DESC, lt.sort_order ASC, l.name ASC
  LIMIT result_limit;
END;
$$;

-- 5. Get popular locations RPC
CREATE OR REPLACE FUNCTION get_popular_locations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  country_code TEXT,
  slug TEXT,
  country_slug TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  location_type_id UUID,
  location_type_label TEXT,
  location_type_icon TEXT,
  location_type_sort INT,
  allow_pickup BOOLEAN,
  allow_dropoff BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name::TEXT,
    l.address::TEXT,
    l.city::TEXT,
    l.country_code::TEXT,
    l.slug::TEXT,
    l.country_slug::TEXT,
    l.latitude::FLOAT8,
    l.longitude::FLOAT8,
    l.location_type_id,
    lt.label::TEXT,
    lt.icon_name::TEXT,
    lt.sort_order,
    l.allow_pickup,
    l.allow_dropoff
  FROM public.locations l
  JOIN public.location_types lt ON lt.id = l.location_type_id
  WHERE l.is_active = true
    AND l.is_popular = true
    AND lt.is_active = true
  ORDER BY lt.sort_order ASC, l.name ASC;
END;
$$;

-- 6. Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION search_locations(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_popular_locations() TO anon, authenticated;
