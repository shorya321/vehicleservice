-- Create vehicle_features table for master feature list
CREATE TABLE IF NOT EXISTS public.vehicle_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    category TEXT CHECK (category IN ('comfort', 'safety', 'technology', 'entertainment', 'convenience', 'performance')),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create vehicle_feature_mappings junction table
CREATE TABLE IF NOT EXISTS public.vehicle_feature_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES public.vehicle_features(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(vehicle_id, feature_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_feature_mappings_vehicle_id ON public.vehicle_feature_mappings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_feature_mappings_feature_id ON public.vehicle_feature_mappings(feature_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_features_slug ON public.vehicle_features(slug);
CREATE INDEX IF NOT EXISTS idx_vehicle_features_category ON public.vehicle_features(category);
CREATE INDEX IF NOT EXISTS idx_vehicle_features_is_active ON public.vehicle_features(is_active);

-- Insert default features
INSERT INTO public.vehicle_features (name, slug, category, icon, sort_order) VALUES
    -- Safety Features
    ('Airbags', 'airbags', 'safety', 'shield', 10),
    ('ABS (Anti-lock Braking System)', 'abs', 'safety', 'shield-check', 20),
    ('Backup Camera', 'backup-camera', 'safety', 'camera', 30),
    ('Parking Sensors', 'parking-sensors', 'safety', 'radar', 40),
    ('Blind Spot Monitoring', 'blind-spot-monitoring', 'safety', 'eye', 50),
    ('Lane Departure Warning', 'lane-departure-warning', 'safety', 'road', 60),
    
    -- Comfort Features
    ('Air Conditioning', 'air-conditioning', 'comfort', 'wind', 70),
    ('Heated Seats', 'heated-seats', 'comfort', 'thermometer', 80),
    ('Leather Seats', 'leather-seats', 'comfort', 'sofa', 90),
    ('Sunroof/Moonroof', 'sunroof', 'comfort', 'sun', 100),
    ('Power Windows', 'power-windows', 'comfort', 'square', 110),
    ('Power Seats', 'power-seats', 'comfort', 'settings', 120),
    
    -- Technology Features
    ('GPS Navigation', 'gps-navigation', 'technology', 'navigation', 130),
    ('Bluetooth Connectivity', 'bluetooth', 'technology', 'bluetooth', 140),
    ('USB Ports', 'usb-ports', 'technology', 'usb', 150),
    ('Wireless Charging', 'wireless-charging', 'technology', 'battery-charging', 160),
    ('Keyless Entry', 'keyless-entry', 'technology', 'key', 170),
    ('Push Button Start', 'push-button-start', 'technology', 'power', 180),
    
    -- Entertainment Features
    ('Apple CarPlay', 'apple-carplay', 'entertainment', 'smartphone', 190),
    ('Android Auto', 'android-auto', 'entertainment', 'smartphone', 200),
    ('Premium Sound System', 'premium-sound', 'entertainment', 'music', 210),
    ('Rear Entertainment System', 'rear-entertainment', 'entertainment', 'tv', 220),
    
    -- Convenience Features
    ('Cruise Control', 'cruise-control', 'convenience', 'gauge', 230),
    ('Adaptive Cruise Control', 'adaptive-cruise-control', 'convenience', 'zap', 240),
    ('Automatic Transmission', 'automatic-transmission', 'convenience', 'settings-2', 250),
    ('All-Wheel Drive', 'all-wheel-drive', 'convenience', 'circle', 260),
    ('Roof Rack', 'roof-rack', 'convenience', 'package', 270),
    ('Tow Hitch', 'tow-hitch', 'convenience', 'truck', 280),
    
    -- Performance Features
    ('Turbo Engine', 'turbo-engine', 'performance', 'zap', 290),
    ('Sport Mode', 'sport-mode', 'performance', 'activity', 300),
    ('Performance Tires', 'performance-tires', 'performance', 'disc', 310),
    ('Performance Brakes', 'performance-brakes', 'performance', 'disc-2', 320)
ON CONFLICT (slug) DO NOTHING;

-- Create RLS policies
ALTER TABLE public.vehicle_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_feature_mappings ENABLE ROW LEVEL SECURITY;

-- Vehicle features policies (read by all, write by admin only)
CREATE POLICY "Anyone can view active features" ON public.vehicle_features
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all features" ON public.vehicle_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Vehicle feature mappings policies
CREATE POLICY "Anyone can view vehicle features" ON public.vehicle_feature_mappings
    FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their vehicle features" ON public.vehicle_feature_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.vendor_applications va ON v.business_id = va.id
            WHERE v.id = vehicle_feature_mappings.vehicle_id
            AND va.user_id = auth.uid()
            AND va.status = 'approved'
        )
    );

CREATE POLICY "Admins can manage all vehicle features" ON public.vehicle_feature_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for vehicle_features
CREATE TRIGGER update_vehicle_features_updated_at BEFORE UPDATE ON public.vehicle_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();