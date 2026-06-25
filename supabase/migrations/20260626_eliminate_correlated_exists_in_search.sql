-- Fix: eliminate correlated EXISTS subqueries that cause statement timeouts (57014).
--
-- Root cause: 20260625_fix_candidate_ordering.sql re-introduced correlated EXISTS
-- in ORDER BY that was specifically removed in 20260623 to fix timeouts.
-- The EXISTS in ORDER BY forces per-row evaluation across all matching locations
-- before LIMIT can take effect.
--
-- Fix: pre-compute alias matches in a single CTE (runs once, indexed),
-- then LEFT JOIN into candidates. Replaces all 7 correlated EXISTS references.

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

  -- Branch: short queries use prefix matching (B-tree friendly)
  IF query_len < 3 THEN
    RETURN QUERY
    WITH alias_matches AS (
      SELECT la.location_id
      FROM public.location_aliases la
      WHERE lower(la.alias) = normalized_query
      GROUP BY la.location_id
    ),
    candidates AS (
      SELECT
        l.id, l.name, l.address, l.city, l.country_code,
        l.slug, l.country_slug, l.latitude::FLOAT8, l.longitude::FLOAT8,
        l.location_type_id, l.allow_pickup, l.allow_dropoff, l.is_popular,
        (am.location_id IS NOT NULL) AS alias_exact
      FROM public.locations l
      LEFT JOIN alias_matches am ON am.location_id = l.id
      WHERE l.is_active = true
        AND (
          lower(l.name) LIKE normalized_query || '%'
          OR lower(l.city) LIKE normalized_query || '%'
          OR am.location_id IS NOT NULL
        )
      ORDER BY
        CASE
          WHEN lower(l.name) = normalized_query THEN 0
          WHEN am.location_id IS NOT NULL THEN 1
          WHEN lower(l.name) LIKE normalized_query || '%' THEN 2
          WHEN lower(l.city) = normalized_query THEN 3
          ELSE 4
        END,
        l.is_popular DESC NULLS LAST,
        l.name
      LIMIT 50
    ),
    scored AS (
      SELECT
        c.id,
        c.name::TEXT,
        c.address::TEXT,
        c.city::TEXT,
        c.country_code::TEXT,
        c.slug::TEXT,
        c.country_slug::TEXT,
        c.latitude,
        c.longitude,
        c.location_type_id,
        lt.label::TEXT AS location_type_label,
        lt.icon_name::TEXT AS location_type_icon,
        lt.sort_order AS location_type_sort,
        c.allow_pickup,
        c.allow_dropoff,
        lt.name AS type_name,
        (
          CASE
            WHEN c.alias_exact THEN 1.0
            WHEN lower(c.name) = normalized_query THEN 1.0
            WHEN lower(c.name) LIKE normalized_query || '%'
              AND length(c.name) <= query_len * 2 THEN 0.95
            WHEN lower(c.name) LIKE normalized_query || '%' THEN 0.88
            WHEN lower(c.city) = normalized_query THEN 0.85
            WHEN lower(c.city) LIKE normalized_query || '%' THEN 0.8
            ELSE 0.4
          END
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
          * CASE
              WHEN length(c.name) <= query_len * 2 THEN 1.0
              WHEN length(c.name) <= 40 THEN 0.95
              WHEN length(c.name) <= 60 THEN 0.85
              WHEN length(c.name) <= 80 THEN 0.65
              ELSE 0.45
            END
          + CASE WHEN c.is_popular THEN 0.1 ELSE 0.0 END
        )::FLOAT4 AS raw_relevance
      FROM candidates c
      JOIN public.location_types lt ON lt.id = c.location_type_id AND lt.is_active = true
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
      r.id, r.name, r.address, r.city, r.country_code,
      r.slug, r.country_slug, r.latitude, r.longitude,
      r.location_type_id, r.location_type_label, r.location_type_icon,
      r.location_type_sort, r.allow_pickup, r.allow_dropoff,
      r.raw_relevance AS relevance
    FROM ranked r
    WHERE r.type_rank <= 5
    ORDER BY r.raw_relevance DESC, r.location_type_sort ASC, r.name ASC
    LIMIT result_limit;

  -- Branch: longer queries use full substring matching (trigram indexes help)
  ELSE
    RETURN QUERY
    WITH alias_matches AS (
      SELECT
        la.location_id,
        bool_or(lower(la.alias) = normalized_query) AS is_exact,
        bool_or(la.alias ILIKE '%' || normalized_query || '%') AS is_partial
      FROM public.location_aliases la
      WHERE lower(la.alias) = normalized_query
         OR la.alias ILIKE '%' || normalized_query || '%'
      GROUP BY la.location_id
    ),
    candidates AS (
      SELECT
        l.id, l.name, l.address, l.city, l.country_code,
        l.slug, l.country_slug, l.latitude::FLOAT8, l.longitude::FLOAT8,
        l.location_type_id, l.allow_pickup, l.allow_dropoff, l.is_popular,
        COALESCE(am.is_exact, false) AS alias_exact,
        COALESCE(am.is_partial, false) AS alias_partial
      FROM public.locations l
      LEFT JOIN alias_matches am ON am.location_id = l.id
      WHERE l.is_active = true
        AND (
          l.name ILIKE '%' || normalized_query || '%'
          OR l.city ILIKE '%' || normalized_query || '%'
          OR l.address ILIKE '%' || normalized_query || '%'
          OR am.location_id IS NOT NULL
          OR (is_multi_word AND EXISTS (
            SELECT 1 FROM unnest(query_tokens) t
            WHERE l.name ILIKE '%' || t || '%'
          ))
        )
      ORDER BY
        CASE
          WHEN lower(l.name) = normalized_query THEN 0
          WHEN COALESCE(am.is_exact, false) THEN 1
          WHEN lower(l.name) LIKE normalized_query || '%' THEN 2
          WHEN lower(l.city) = normalized_query THEN 3
          WHEN l.name ILIKE '%' || normalized_query || '%' THEN 4
          ELSE 5
        END,
        l.is_popular DESC NULLS LAST,
        l.name
      LIMIT 150
    ),
    scored AS (
      SELECT
        c.id,
        c.name::TEXT,
        c.address::TEXT,
        c.city::TEXT,
        c.country_code::TEXT,
        c.slug::TEXT,
        c.country_slug::TEXT,
        c.latitude,
        c.longitude,
        c.location_type_id,
        lt.label::TEXT AS location_type_label,
        lt.icon_name::TEXT AS location_type_icon,
        lt.sort_order AS location_type_sort,
        c.allow_pickup,
        c.allow_dropoff,
        lt.name AS type_name,
        (
          CASE
            WHEN c.alias_exact THEN 1.0
            WHEN lower(c.name) = normalized_query THEN 1.0
            WHEN lower(c.name) LIKE normalized_query || '%'
              AND length(c.name) <= query_len * 2 THEN 0.95
            WHEN lower(c.name) LIKE normalized_query || '%' THEN 0.88
            WHEN lower(c.city) = normalized_query THEN 0.85
            WHEN lower(c.city) LIKE normalized_query || '%' THEN 0.8
            WHEN is_multi_word AND (
              SELECT bool_and(lower(c.name) LIKE '%' || t || '%')
              FROM unnest(query_tokens) t
            ) THEN 0.85
            WHEN is_multi_word AND (
              SELECT bool_and(
                lower(c.name) LIKE '%' || t || '%'
                OR lower(COALESCE(c.city, '')) LIKE '%' || t || '%'
              )
              FROM unnest(query_tokens) t
            ) THEN 0.7
            WHEN c.name ILIKE '%' || normalized_query || '%' THEN 0.6
            WHEN c.alias_partial THEN 0.55
            WHEN c.city ILIKE '%' || normalized_query || '%' THEN 0.5
            WHEN c.address ILIKE '%' || normalized_query || '%' THEN 0.4
            ELSE 0.2
          END
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
          * CASE
              WHEN length(c.name) <= query_len * 2 THEN 1.0
              WHEN length(c.name) <= 40 THEN 0.95
              WHEN length(c.name) <= 60 THEN 0.85
              WHEN length(c.name) <= 80 THEN 0.65
              ELSE 0.45
            END
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
          + CASE WHEN c.is_popular THEN 0.1 ELSE 0.0 END
        )::FLOAT4 AS raw_relevance
      FROM candidates c
      JOIN public.location_types lt ON lt.id = c.location_type_id AND lt.is_active = true
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
      r.id, r.name, r.address, r.city, r.country_code,
      r.slug, r.country_slug, r.latitude, r.longitude,
      r.location_type_id, r.location_type_label, r.location_type_icon,
      r.location_type_sort, r.allow_pickup, r.allow_dropoff,
      r.raw_relevance AS relevance
    FROM ranked r
    WHERE r.type_rank <= 5
    ORDER BY r.raw_relevance DESC, r.location_type_sort ASC, r.name ASC
    LIMIT result_limit;

  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION search_locations(TEXT, INT) TO anon, authenticated;
