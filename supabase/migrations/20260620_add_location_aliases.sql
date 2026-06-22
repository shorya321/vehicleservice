-- ============================================================
-- Location Aliases Table for Abbreviation/Alternate Name Search
-- ============================================================

-- 1. Create aliases table
CREATE TABLE IF NOT EXISTS location_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, alias)
);

-- 2. Trigram index for fast fuzzy matching on aliases
CREATE INDEX idx_location_aliases_alias_trgm
  ON location_aliases USING GIN(alias gin_trgm_ops);

CREATE INDEX idx_location_aliases_location_id
  ON location_aliases(location_id);

-- 3. RLS policies
ALTER TABLE location_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read aliases"
  ON location_aliases FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage aliases"
  ON location_aliases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Grant access
GRANT SELECT ON location_aliases TO anon, authenticated;
