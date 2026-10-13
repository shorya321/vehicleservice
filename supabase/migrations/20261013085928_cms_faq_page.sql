-- /faq: a system page like About. Renders its shipped copy whatever the
-- row holds, so it is seeded published (and in the sitemap) from the start.
ALTER TABLE public.pages DROP CONSTRAINT pages_template_check;
ALTER TABLE public.pages ADD CONSTRAINT pages_template_check
  CHECK (template IN ('home', 'contact', 'about', 'faq', 'terms', 'privacy', 'become-vendor', 'vendor-agreement', 'blocks'));

INSERT INTO public.pages (slug, kind, template, title, status, published_at)
VALUES ('/faq', 'system', 'faq', 'FAQ', 'published', now())
ON CONFLICT (slug) DO NOTHING;
