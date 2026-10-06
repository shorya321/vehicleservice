-- Admin-managed page content and SEO metadata for public pages.
-- Applied via Supabase MCP apply_migration as version 20261006100244.

CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'custom' CHECK (kind IN ('system', 'custom')),
  template text NOT NULL CHECK (template IN ('home', 'contact', 'terms', 'privacy', 'become-vendor', 'blocks')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX pages_updated_by_idx ON public.pages (updated_by);

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published pages"
  ON public.pages FOR SELECT
  USING (status = 'published' OR public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can insert pages"
  ON public.pages FOR INSERT
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update pages"
  ON public.pages FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- System pages back real routes, so only custom pages may be deleted.
CREATE POLICY "Admins can delete custom pages"
  ON public.pages FOR DELETE
  USING (kind = 'custom' AND public.is_admin((SELECT auth.uid())));

INSERT INTO public.pages (slug, kind, template, title, status, published_at) VALUES
  ('/', 'system', 'home', 'Home', 'published', now()),
  ('/contact', 'system', 'contact', 'Contact', 'published', now()),
  ('/terms', 'system', 'terms', 'Terms of Service', 'published', now()),
  ('/privacy', 'system', 'privacy', 'Privacy Policy', 'published', now()),
  ('/become-vendor', 'system', 'become-vendor', 'Become a Partner', 'published', now());

-- One SEO record per public entity, whatever its table.
CREATE TABLE public.seo_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('page', 'blog_post', 'blog_category', 'route', 'zone', 'location')),
  entity_id uuid NOT NULL,
  meta_title text CHECK (meta_title IS NULL OR char_length(meta_title) <= 120),
  meta_description text CHECK (meta_description IS NULL OR char_length(meta_description) <= 320),
  og_image_url text,
  canonical_path text,
  noindex boolean NOT NULL DEFAULT false,
  nofollow boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX seo_meta_updated_by_idx ON public.seo_meta (updated_by);

CREATE TRIGGER seo_meta_updated_at
  BEFORE UPDATE ON public.seo_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seo_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo meta"
  ON public.seo_meta FOR SELECT USING (true);

CREATE POLICY "Admins can insert seo meta"
  ON public.seo_meta FOR INSERT
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update seo meta"
  ON public.seo_meta FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete seo meta"
  ON public.seo_meta FOR DELETE
  USING (public.is_admin((SELECT auth.uid())));

-- Site-wide SEO defaults. Separate from site_settings because the General
-- settings form rewrites that whole config and would drop keys it does not know.
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX seo_settings_updated_by_idx ON public.seo_settings (updated_by);

CREATE TRIGGER seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo settings"
  ON public.seo_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert seo settings"
  ON public.seo_settings FOR INSERT
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update seo settings"
  ON public.seo_settings FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

INSERT INTO public.seo_settings (config) VALUES ('{}'::jsonb);
