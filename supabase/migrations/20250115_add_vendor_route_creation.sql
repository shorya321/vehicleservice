-- Add vendor route creation support to routes table

-- Add columns for vendor route creation
ALTER TABLE routes 
ADD COLUMN created_by UUID REFERENCES vendor_applications(id) ON DELETE SET NULL,
ADD COLUMN created_by_type VARCHAR(10) DEFAULT 'admin' CHECK (created_by_type IN ('admin', 'vendor')),
ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- Update existing routes to be admin-created
UPDATE routes 
SET created_by_type = 'admin', 
    is_shared = true 
WHERE created_by_type IS NULL OR created_by_type = 'admin';

-- Remove the unique constraint on route combination to allow multiple vendors to create similar routes
ALTER TABLE routes DROP CONSTRAINT IF EXISTS unique_route_combination;

-- Create new constraint that allows multiple vendor routes between same locations
-- but prevents duplicate admin routes
CREATE UNIQUE INDEX unique_admin_route_combination 
ON routes (origin_location_id, destination_location_id) 
WHERE created_by_type = 'admin';

-- Update route_slug to not be globally unique (vendors can have similar slugs)
ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_route_slug_key;

-- Create new constraint for unique slugs per creator
CREATE UNIQUE INDEX unique_route_slug_per_creator 
ON routes (route_slug, COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid));

-- Update RLS policies to allow vendor route creation

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active routes" ON routes;
DROP POLICY IF EXISTS "Admins can manage routes" ON routes;

-- Create new policies for vendor route creation

-- Allow everyone to view active routes (admin routes and shared vendor routes)
CREATE POLICY "Public can view active routes"
    ON routes
    FOR SELECT
    USING (
        is_active = true AND (
            created_by_type = 'admin' OR 
            (created_by_type = 'vendor' AND is_shared = true)
        )
    );

-- Allow vendors to view their own routes (active or inactive)
CREATE POLICY "Vendors can view own routes"
    ON routes
    FOR SELECT
    USING (
        created_by IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid()
        )
    );

-- Allow admins to manage all routes
CREATE POLICY "Admins can manage all routes"
    ON routes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow vendors to create their own routes
CREATE POLICY "Vendors can create own routes"
    ON routes
    FOR INSERT
    WITH CHECK (
        created_by IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid() 
            AND status = 'approved'
        ) AND
        created_by_type = 'vendor'
    );

-- Allow vendors to update their own routes
CREATE POLICY "Vendors can update own routes"
    ON routes
    FOR UPDATE
    USING (
        created_by IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid() 
            AND status = 'approved'
        ) AND
        created_by_type = 'vendor'
    );

-- Allow vendors to delete their own routes
CREATE POLICY "Vendors can delete own routes"
    ON routes
    FOR DELETE
    USING (
        created_by IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid() 
            AND status = 'approved'
        ) AND
        created_by_type = 'vendor'
    );

-- Add comments for new columns
COMMENT ON COLUMN routes.created_by IS 'ID of the vendor who created this route (NULL for admin-created routes)';
COMMENT ON COLUMN routes.created_by_type IS 'Type of creator: admin or vendor';
COMMENT ON COLUMN routes.is_shared IS 'Whether vendor-created route is shared with other vendors';

-- Update vendor_route_services table to handle vendor-created routes
-- Remove the existing foreign key constraint and create a new one
ALTER TABLE vendor_route_services DROP CONSTRAINT IF EXISTS vendor_route_services_route_id_fkey;

-- Add back the constraint (it should still work with the updated routes table)
ALTER TABLE vendor_route_services 
ADD CONSTRAINT vendor_route_services_route_id_fkey 
FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;

-- Update the vendor_route_services RLS policies to handle vendor routes
DROP POLICY IF EXISTS "Vendors can view own route services" ON vendor_route_services;
DROP POLICY IF EXISTS "Vendors can manage own route services" ON vendor_route_services;

-- Create updated policies
CREATE POLICY "Vendors can view own route services"
    ON vendor_route_services
    FOR SELECT
    USING (
        vendor_id IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Vendors can manage own route services"
    ON vendor_route_services
    FOR ALL
    USING (
        vendor_id IN (
            SELECT id FROM vendor_applications 
            WHERE user_id = auth.uid() AND status = 'approved'
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to auto-enable vendor routes for their creator
CREATE OR REPLACE FUNCTION auto_enable_vendor_route()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a vendor-created route, automatically create a vendor_route_service for the creator
    IF NEW.created_by_type = 'vendor' AND NEW.created_by IS NOT NULL THEN
        INSERT INTO vendor_route_services (vendor_id, route_id, is_active, price_multiplier)
        VALUES (NEW.created_by, NEW.id, true, 1.0)
        ON CONFLICT (vendor_id, route_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-enable vendor routes
CREATE TRIGGER auto_enable_vendor_route_trigger
    AFTER INSERT ON routes
    FOR EACH ROW
    EXECUTE FUNCTION auto_enable_vendor_route();