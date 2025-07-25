-- Add slug fields to locations and vehicle_categories tables

-- Add slug to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create unique index for location slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);

-- Add slug to vehicle_categories table
ALTER TABLE vehicle_categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create unique index for category slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_categories_slug ON vehicle_categories(slug);

-- Update existing locations with slugs
UPDATE locations 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^\w\s-]', '', 'g'), -- Remove special characters
      '[\s_-]+', '-', 'g' -- Replace spaces with hyphens
    ),
    '^-+|-+$', '', 'g' -- Remove leading/trailing hyphens
  )
)
WHERE slug IS NULL;

-- Update existing vehicle categories with slugs
UPDATE vehicle_categories 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^\w\s-]', '', 'g'), -- Remove special characters
      '[\s_-]+', '-', 'g' -- Replace spaces with hyphens
    ),
    '^-+|-+$', '', 'g' -- Remove leading/trailing hyphens
  )
)
WHERE slug IS NULL;

-- Make slug columns NOT NULL after populating
ALTER TABLE locations 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE vehicle_categories 
ALTER COLUMN slug SET NOT NULL;

-- Add country slug to locations for better URL structure
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS country_slug VARCHAR(50);

-- Update country slugs based on country codes
UPDATE locations
SET country_slug = CASE 
  WHEN country_code = 'IN' THEN 'india'
  WHEN country_code = 'PK' THEN 'pakistan'
  WHEN country_code = 'BD' THEN 'bangladesh'
  WHEN country_code = 'LK' THEN 'sri-lanka'
  WHEN country_code = 'NP' THEN 'nepal'
  WHEN country_code = 'BT' THEN 'bhutan'
  WHEN country_code = 'MV' THEN 'maldives'
  WHEN country_code = 'AF' THEN 'afghanistan'
  ELSE LOWER(country_code)
END
WHERE country_slug IS NULL;

-- Make country_slug NOT NULL
ALTER TABLE locations
ALTER COLUMN country_slug SET NOT NULL;

-- Create index for country_slug
CREATE INDEX IF NOT EXISTS idx_locations_country_slug ON locations(country_slug);