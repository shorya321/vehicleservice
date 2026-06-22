-- ============================================================
-- Phase 2: Improved search_locations with:
-- 1. Multi-word tokenized search
-- 2. Semantic type-intent matching
-- 3. Exact alias match priority
-- 4. Hotel type rebalance (0.7 → 1.0)
-- 5. Higher fuzzy threshold (0.2 → 0.3)
-- 6. Higher minimum relevance floor (0.05 → 0.15)
-- ============================================================

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
  query_tokens TEXT[];
  token_count INT;
  is_multi_word BOOLEAN;
BEGIN
  normalized_query := lower(trim(search_query));
  query_len := length(normalized_query);

  IF query_len < 2 THEN
    RETURN;
  END IF;

  query_tokens := regexp_split_to_array(normalized_query, '\s+');
  token_count := array_length(query_tokens, 1);
  is_multi_word := token_count > 1;

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
        -- === BASE TEXT MATCH SCORE ===
        CASE
          -- Exact alias match (highest priority for codes like DXB, DWC)
          WHEN EXISTS (
            SELECT 1 FROM public.location_aliases la
            WHERE la.location_id = l.id
            AND lower(la.alias) = normalized_query
          ) THEN 1.0

          -- Exact name match
          WHEN lower(l.name) = normalized_query THEN 1.0

          -- Name starts with query (short, precise match)
          WHEN lower(l.name) LIKE normalized_query || '%'
            AND length(l.name) <= query_len * 2 THEN 0.95

          -- Name starts with query (longer name)
          WHEN lower(l.name) LIKE normalized_query || '%' THEN 0.88

          -- Exact city match
          WHEN lower(l.city) = normalized_query THEN 0.85

          -- City starts with query
          WHEN lower(l.city) LIKE normalized_query || '%' THEN 0.8

          -- Multi-word: all tokens match in name (word-boundary aware)
          WHEN is_multi_word AND (
            SELECT count(*) FROM unnest(query_tokens) t
            WHERE lower(l.name) ~* ('\m' || t)
          ) = token_count THEN 0.85

          -- Multi-word: all tokens match across name + city + address
          WHEN is_multi_word AND (
            SELECT count(*) FROM unnest(query_tokens) t
            WHERE lower(l.name) ~* ('\m' || t)
               OR lower(COALESCE(l.city, '')) ~* ('\m' || t)
               OR lower(COALESCE(l.address, '')) ~* ('\m' || t)
          ) = token_count THEN 0.7

          -- Multi-word: partial token match (at least half tokens match)
          WHEN is_multi_word AND (
            SELECT count(*) FROM unnest(query_tokens) t
            WHERE lower(l.name) ~* ('\m' || t)
               OR lower(COALESCE(l.city, '')) ~* ('\m' || t)
          )::FLOAT / token_count >= 0.5 THEN 0.5 * (
            SELECT count(*)::FLOAT / token_count FROM unnest(query_tokens) t
            WHERE lower(l.name) ~* ('\m' || t)
               OR lower(COALESCE(l.city, '')) ~* ('\m' || t)
          )

          -- Single word: name contains query at word boundary
          WHEN NOT is_multi_word AND lower(l.name) ~* ('\m' || normalized_query) THEN 0.65

          -- Single word: name substring match (no word boundary)
          WHEN l.name ILIKE '%' || normalized_query || '%' THEN 0.5

          -- Address substring match
          WHEN l.address ILIKE '%' || normalized_query || '%' THEN 0.4

          -- Alias substring match
          WHEN EXISTS (
            SELECT 1 FROM public.location_aliases la
            WHERE la.location_id = l.id
            AND la.alias ILIKE '%' || normalized_query || '%'
          ) THEN 0.55

          -- Fuzzy match fallback (higher threshold: 0.3)
          ELSE GREATEST(
            public.similarity(l.name, search_query) * 0.85,
            public.similarity(COALESCE(l.city, ''), search_query) * 0.7
          )
        END

        -- === TYPE BOOST MULTIPLIER ===
        * CASE lt.name
            WHEN 'airport' THEN 1.5
            WHEN 'city' THEN 1.4
            WHEN 'tourist_attraction' THEN 1.2
            WHEN 'shopping_mall' THEN 1.15
            WHEN 'resort' THEN 1.1
            WHEN 'metro_station' THEN 1.15
            WHEN 'bus_station' THEN 1.1
            WHEN 'tram_station' THEN 1.1
            WHEN 'transport_hub' THEN 1.1
            WHEN 'hotel' THEN 1.0
            WHEN 'park' THEN 1.0
            WHEN 'museum' THEN 1.05
            WHEN 'beach' THEN 1.05
            WHEN 'theme_park' THEN 1.1
            WHEN 'marina' THEN 1.05
            ELSE 1.0
          END

        -- === NAME LENGTH PENALTY (demote verbose names) ===
        * CASE
            WHEN length(l.name) <= query_len * 2 THEN 1.0
            WHEN length(l.name) <= 40 THEN 0.95
            WHEN length(l.name) <= 60 THEN 0.85
            WHEN length(l.name) <= 80 THEN 0.65
            ELSE 0.45
          END

        -- === SEMANTIC TYPE-INTENT BONUS ===
        -- When user searches "hotel", boost Hotel type results
        -- When user searches "metro", boost Metro Station results
        + CASE
            WHEN normalized_query ILIKE '%airport%' AND lt.name = 'airport' THEN 0.4
            WHEN normalized_query ILIKE '%hotel%' AND lt.name = 'hotel' THEN 0.4
            WHEN normalized_query ILIKE '%metro%' AND lt.name = 'metro_station' THEN 0.4
            WHEN normalized_query ILIKE '%mall%' AND lt.name = 'shopping_mall' THEN 0.3
            WHEN normalized_query ILIKE '%bus%' AND lt.name = 'bus_station' THEN 0.3
            WHEN normalized_query ILIKE '%tram%' AND lt.name = 'tram_station' THEN 0.3
            WHEN normalized_query ILIKE '%station%' AND lt.name IN ('metro_station', 'bus_station', 'tram_station', 'station') THEN 0.3
            WHEN normalized_query ILIKE '%park%' AND lt.name IN ('park', 'theme_park') THEN 0.2
            WHEN normalized_query ILIKE '%beach%' AND lt.name = 'beach' THEN 0.3
            WHEN normalized_query ILIKE '%museum%' AND lt.name = 'museum' THEN 0.3
            WHEN normalized_query ILIKE '%mosque%' AND lt.name = 'mosque' THEN 0.3
            WHEN normalized_query ILIKE '%hospital%' AND lt.name = 'hospital' THEN 0.3
            WHEN normalized_query ILIKE '%resort%' AND lt.name = 'resort' THEN 0.3
            WHEN normalized_query ILIKE '%marina%' AND lt.name = 'marina' THEN 0.3
            ELSE 0.0
          END

        -- === POPULAR LOCATION BONUS ===
        + CASE WHEN l.is_popular THEN 0.1 ELSE 0.0 END

      )::FLOAT4 AS raw_relevance
    FROM public.locations l
    JOIN public.location_types lt ON lt.id = l.location_type_id
    WHERE l.is_active = true
      AND lt.is_active = true
      AND (
        -- Exact alias match
        EXISTS (
          SELECT 1 FROM public.location_aliases la
          WHERE la.location_id = l.id
          AND lower(la.alias) = normalized_query
        )
        -- Name/city/address substring
        OR l.name ILIKE '%' || normalized_query || '%'
        OR l.city ILIKE '%' || normalized_query || '%'
        OR l.address ILIKE '%' || normalized_query || '%'
        -- Alias substring
        OR EXISTS (
          SELECT 1 FROM public.location_aliases la
          WHERE la.location_id = l.id
          AND la.alias ILIKE '%' || normalized_query || '%'
        )
        -- Multi-word: any token matches name
        OR (is_multi_word AND EXISTS (
          SELECT 1 FROM unnest(query_tokens) t
          WHERE l.name ILIKE '%' || t || '%'
        ))
        -- Fuzzy match (higher threshold)
        OR public.similarity(l.name, search_query) > 0.3
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
    WHERE s.raw_relevance > 0.15
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
  WHERE r.type_rank <= 5
  ORDER BY r.raw_relevance DESC, r.location_type_sort ASC, r.name ASC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION search_locations(TEXT, INT) TO anon, authenticated;
