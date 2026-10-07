-- /vendor-agreement: a legal page like Terms and Privacy, seeded as a draft so
-- the default copy is reviewed before it goes live (Admin > Pages > Publish).
ALTER TABLE public.pages DROP CONSTRAINT pages_template_check;
ALTER TABLE public.pages ADD CONSTRAINT pages_template_check
  CHECK (template IN ('home', 'contact', 'terms', 'privacy', 'become-vendor', 'vendor-agreement', 'blocks'));

INSERT INTO public.pages (slug, kind, template, title, status)
VALUES ('/vendor-agreement', 'system', 'vendor-agreement', 'Vendor Agreement', 'draft')
ON CONFLICT (slug) DO NOTHING;
