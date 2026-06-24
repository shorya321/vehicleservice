-- Composite index for the EXISTS subquery in search_locations candidates CTE
-- Covers: WHERE la.location_id = l.id AND lower(la.alias) = normalized_query
CREATE INDEX IF NOT EXISTS idx_location_aliases_location_id_lower_alias
  ON public.location_aliases (location_id, lower(alias));

-- Safety net: ensure trigram indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_locations_address_trgm
  ON public.locations USING GIN(address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_location_aliases_alias_trgm
  ON public.location_aliases USING GIN(alias gin_trgm_ops);
