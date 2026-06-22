-- ============================================================
-- Location Types Table
-- Replaces the location_type enum with a proper reference table
-- so admins can manage location types via the admin panel.
-- ============================================================

-- 1. Create location_types table
CREATE TABLE location_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'map-pin',
  color_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  abbreviation CHAR(1) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS policies
ALTER TABLE location_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can view active location types"
  ON location_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin users can manage location types"
  ON location_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Seed existing 4 types with icon and color configs
INSERT INTO location_types (name, label, icon_name, color_config, abbreviation, sort_order) VALUES
  (
    'airport',
    'Airport',
    'plane',
    '{"color": "text-sky-500", "bg": "bg-sky-500/10", "progressBg": "bg-sky-500", "badgeClass": "border border-sky-500/20 bg-sky-500/5 text-sky-500", "badgeVariant": "default"}'::jsonb,
    'A',
    1
  ),
  (
    'city',
    'City',
    'building-2',
    '{"color": "text-emerald-500", "bg": "bg-emerald-500/10", "progressBg": "bg-emerald-500", "badgeClass": "border border-emerald-500/20 bg-emerald-500/5 text-emerald-500", "badgeVariant": "secondary"}'::jsonb,
    'C',
    2
  ),
  (
    'hotel',
    'Hotel',
    'hotel',
    '{"color": "text-amber-500", "bg": "bg-amber-500/10", "progressBg": "bg-amber-500", "badgeClass": "border border-amber-500/20 bg-amber-500/5 text-amber-500", "badgeVariant": "outline"}'::jsonb,
    'H',
    3
  ),
  (
    'station',
    'Station',
    'train',
    '{"color": "text-violet-500", "bg": "bg-violet-500/10", "progressBg": "bg-violet-500", "badgeClass": "border border-violet-500/20 bg-violet-500/5 text-violet-500", "badgeVariant": "destructive"}'::jsonb,
    'S',
    4
  );

-- 4. Add location_type_id FK column to locations (nullable during backfill)
ALTER TABLE locations ADD COLUMN location_type_id UUID REFERENCES location_types(id);

CREATE INDEX idx_locations_location_type_id ON locations(location_type_id);

-- 5. Backfill location_type_id from existing type column
UPDATE locations
SET location_type_id = lt.id
FROM location_types lt
WHERE locations.type::text = lt.name;

-- 6. Make NOT NULL after backfill
ALTER TABLE locations ALTER COLUMN location_type_id SET NOT NULL;
