-- Insert vehicle types based on common configurations
-- First, ensure we have the necessary categories
INSERT INTO vehicle_categories (name, slug, description, sort_order)
VALUES 
  ('Economy', 'economy', 'Affordable and fuel-efficient vehicles', 1),
  ('Comfort', 'comfort', 'Premium comfort vehicles with extra space', 2),
  ('Minibus', 'minibus', 'Large capacity vehicles for groups', 3),
  ('Luxury', 'luxury', 'High-end luxury vehicles', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert vehicle types
WITH category_ids AS (
  SELECT 
    id,
    slug
  FROM vehicle_categories
)
INSERT INTO vehicle_types (category_id, name, slug, passenger_capacity, luggage_capacity, description, sort_order)
SELECT 
  category_id,
  name,
  slug,
  passenger_capacity,
  luggage_capacity,
  description,
  sort_order
FROM (
  VALUES
    -- Economy types
    ((SELECT id FROM category_ids WHERE slug = 'economy'), 'Micro', 'micro', 3, 1, 'Small economical cars for up to 3 passengers', 1),
    ((SELECT id FROM category_ids WHERE slug = 'economy'), 'Economy', 'economy-sedan', 4, 2, 'Standard economy sedans for up to 4 passengers', 2),
    
    -- Comfort types
    ((SELECT id FROM category_ids WHERE slug = 'comfort'), 'Comfort', 'comfort-sedan', 4, 3, 'Comfortable sedans with extra legroom', 3),
    ((SELECT id FROM category_ids WHERE slug = 'comfort'), 'Minivan 4PAX', 'minivan-4pax', 4, 4, 'Spacious minivans for up to 4 passengers with extra luggage', 4),
    ((SELECT id FROM category_ids WHERE slug = 'comfort'), 'SUV', 'suv', 6, 4, 'Sport Utility Vehicles for up to 6 passengers', 5),
    
    -- Minibus types
    ((SELECT id FROM category_ids WHERE slug = 'minibus'), 'Minibus 7PAX', 'minibus-7pax', 7, 7, 'Small minibus for up to 7 passengers', 6),
    ((SELECT id FROM category_ids WHERE slug = 'minibus'), 'Minibus 10PAX', 'minibus-10pax', 10, 10, 'Medium minibus for up to 10 passengers', 7),
    ((SELECT id FROM category_ids WHERE slug = 'minibus'), 'Minibus 13PAX', 'minibus-13pax', 13, 13, 'Large minibus for up to 13 passengers', 8),
    ((SELECT id FROM category_ids WHERE slug = 'minibus'), 'Minibus 16PAX', 'minibus-16pax', 16, 16, 'Extra large minibus for up to 16 passengers', 9),
    ((SELECT id FROM category_ids WHERE slug = 'minibus'), 'Minibus 19PAX', 'minibus-19pax', 19, 19, 'Coach for up to 19 passengers', 10),
    
    -- Luxury types
    ((SELECT id FROM category_ids WHERE slug = 'luxury'), 'Luxury Sedan', 'luxury-sedan', 4, 3, 'Premium luxury sedans', 11),
    ((SELECT id FROM category_ids WHERE slug = 'luxury'), 'Luxury SUV', 'luxury-suv', 6, 5, 'Premium luxury SUVs', 12)
) AS vehicle_types_data(category_id, name, slug, passenger_capacity, luggage_capacity, description, sort_order)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  passenger_capacity = EXCLUDED.passenger_capacity,
  luggage_capacity = EXCLUDED.luggage_capacity,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Migrate existing vehicles to appropriate vehicle types based on seats and category
UPDATE vehicles v
SET vehicle_type_id = (
  SELECT vt.id 
  FROM vehicle_types vt
  WHERE vt.category_id = v.category_id
  AND vt.passenger_capacity >= COALESCE(v.seats, 4)
  ORDER BY vt.passenger_capacity ASC
  LIMIT 1
)
WHERE v.vehicle_type_id IS NULL
AND v.category_id IS NOT NULL;

-- For vehicles without categories, assign to economy sedan by default
UPDATE vehicles v
SET vehicle_type_id = (
  SELECT id FROM vehicle_types WHERE slug = 'economy-sedan' LIMIT 1
)
WHERE v.vehicle_type_id IS NULL
AND v.category_id IS NULL;