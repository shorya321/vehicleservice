-- Fix route_searches table to add missing passenger_count column
-- and ensure proper schema alignment

-- Add passenger_count column to route_searches table
ALTER TABLE route_searches 
ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 2;

-- Update the column to have proper constraints
ALTER TABLE route_searches 
ALTER COLUMN passenger_count SET NOT NULL;

-- Add check constraint for passenger_count
ALTER TABLE route_searches 
ADD CONSTRAINT check_passenger_count CHECK (passenger_count >= 1 AND passenger_count <= 20);

-- Create index for better performance on passenger_count searches
CREATE INDEX IF NOT EXISTS idx_route_searches_passenger_count 
ON route_searches(passenger_count);