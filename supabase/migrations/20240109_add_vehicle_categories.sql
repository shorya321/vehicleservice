-- Create vehicle_categories table
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER
);

-- Insert default categories
INSERT INTO public.vehicle_categories (id, name, description, sort_order) VALUES
('economy', 'Economy', 'Budget-friendly vehicles for cost-conscious travelers', 1),
('comfort', 'Comfort', 'Standard comfort vehicles with good features and space', 2),
('business', 'Business', 'Premium and luxury vehicles for business travelers', 3),
('minibus', 'Minibus', 'Large capacity vehicles for group transportation', 4);

-- Add category_id column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN category_id VARCHAR(50);

-- Add foreign key constraint
ALTER TABLE public.vehicles
ADD CONSTRAINT fk_vehicle_category 
FOREIGN KEY (category_id) 
REFERENCES public.vehicle_categories(id);

-- Enable RLS on vehicle_categories table
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_categories table
-- Allow everyone to read categories (they're public reference data)
CREATE POLICY "Anyone can view vehicle categories" ON public.vehicle_categories
    FOR SELECT 
    USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can insert vehicle categories" ON public.vehicle_categories
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update vehicle categories" ON public.vehicle_categories
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete vehicle categories" ON public.vehicle_categories
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Update existing vehicles to have a default category (optional)
-- You can uncomment this if you want to set all existing vehicles to 'economy' by default
-- UPDATE public.vehicles SET category_id = 'economy' WHERE category_id IS NULL;