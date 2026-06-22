-- Fix: Replace LEFT JOIN on location_aliases with EXISTS subquery
-- to prevent row multiplication when a location has multiple matching aliases.

CREATE OR REPLACE FUNCTION search_locations(
  search_query TEXT,
  result_limit INT DEFAULT 20
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
  query_len INT;
BEGIN
  normalized_query := lower(trim(search_query));
  query_len := length(normalized_query);

  IF query_len < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH scored AS (
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
      lt.label::TEXT AS location_type_label,
      lt.icon_name::TEXT AS location_type_icon,
      lt.sort_order AS location_type_sort,
      l.allow_pickup,
      l.allow_dropoff,
      lt.name AS type_name,
      l.is_popular,
      (
        CASE
          WHEN lower(l.name) = normalized_query THEN 1.0
          WHEN lower(l.name) LIKE normalized_query || '%'
            AND length(l.name) <= query_len * 2 THEN 0.95
          WHEN lower(l.name) LIKE normalized_query || '%' THEN 0.88
          WHEN lower(l.city) = normalized_query THEN 0.85
          WHEN lower(l.city) LIKE normalized_query || '%' THEN 0.8
          WHEN l.name ILIKE '%' || normalized_query || '%' THEN 0.6
          WHEN l.address ILIKE '%' || normalized_query || '%' THEN 0.45
          ELSE GREATEST(
            public.similarity(l.name, search_query) * 0.9,
            public.similarity(COALESCE(l.city, ''), search_query) * 0.8
          )
        END
        * CASE lt.name
            WHEN 'airport' THEN 1.5
            WHEN 'city' THEN 1.4
            WHEN 'tourist_attraction' THEN 1.35
            WHEN 'shopping_mall' THEN 1.3
            WHEN 'resort' THEN 1.25
            WHEN 'metro_station' THEN 1.2
            WHEN 'bus_station' THEN 1.2
            WHEN 'tram_station' THEN 1.2
            WHEN 'transport_hub' THEN 1.15
            WHEN 'park' THEN 1.1
            WHEN 'museum' THEN 1.1
            WHEN 'beach' THEN 1.1
            WHEN 'theme_park' THEN 1.1
            WHEN 'hotel' THEN 0.7
            ELSE 1.0
          END
        * CASE
            WHEN length(l.name) <= query_len * 2 THEN 1.0
            WHEN length(l.name) <= 40 THEN 0.95
            WHEN length(l.name) <= 60 THEN 0.8
            WHEN length(l.name) <= 80 THEN 0.6
            ELSE 0.4
          END
        + CASE WHEN l.is_popular THEN 0.1 ELSE 0.0 END
      )::FLOAT4 AS raw_relevance
    FROM public.locations l
    JOIN public.location_types lt ON lt.id = l.location_type_id
    WHERE l.is_active = true
      AND lt.is_active = true
      AND (
        l.name ILIKE '%' || normalized_query || '%'
        OR l.city ILIKE '%' || normalized_query || '%'
        OR l.address ILIKE '%' || normalized_query || '%'
        OR EXISTS (
          SELECT 1 FROM public.location_aliases la
          WHERE la.location_id = l.id
          AND la.alias ILIKE '%' || normalized_query || '%'
        )
        OR public.similarity(l.name, search_query) > 0.2
      )
  ),
  ranked AS (
    SELECT
      s.*,
      ROW_NUMBER() OVER (
        PARTITION BY s.type_name
        ORDER BY s.raw_relevance DESC, s.name ASC
      ) AS type_rank
    FROM scored s
    WHERE s.raw_relevance > 0.05
  )
  SELECT
    r.id,
    r.name,
    r.address,
    r.city,
    r.country_code,
    r.slug,
    r.country_slug,
    r.latitude,
    r.longitude,
    r.location_type_id,
    r.location_type_label,
    r.location_type_icon,
    r.location_type_sort,
    r.allow_pickup,
    r.allow_dropoff,
    r.raw_relevance AS relevance
  FROM ranked r
  WHERE r.type_rank <= 4
  ORDER BY r.raw_relevance DESC, r.location_type_sort ASC, r.name ASC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION search_locations(TEXT, INT) TO anon, authenticated;
