-- Add Google Places data columns to locations table
-- google_place_id is nullable (existing locations don't have it) but unique when present
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_place_types TEXT[];

CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON locations(google_place_id);
