-- Site Settings Table
-- Single-row table for admin-configurable site identity, contact info, social links, and logos

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read (public site needs this for header/footer)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert (for initial seed or re-creation)
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed with defaults
INSERT INTO public.site_settings (config) VALUES ('{
  "brand_name": "Infinia Transfers",
  "header_logo_url": null,
  "footer_logo_url": null,
  "copyright_text": "Infinia Transfers",
  "support_email": "support@infiniatransfers.com",
  "info_email": "info@infiniatransfers.com",
  "bookings_email": "bookings@infiniatransfers.com",
  "support_phone": "+971 50 123 4567",
  "secondary_phone": "+971 4 123 4567",
  "office_address": "Business Bay, Dubai, United Arab Emirates",
  "social_links": {
    "instagram": "",
    "facebook": "",
    "twitter": "",
    "linkedin": "",
    "youtube": "",
    "tiktok": ""
  }
}'::jsonb);

-- Storage policies for site logos
-- Allow admins to upload logos to site-logos/ folder
CREATE POLICY "Admin users can upload site logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = 'site-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update site logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = 'site-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete site logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = 'site-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can view site logos (they're public branding)
CREATE POLICY "Anyone can view site logos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = 'site-logos'
  );
