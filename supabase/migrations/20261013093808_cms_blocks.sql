-- Shared page sections edited once and rendered on several pages (the
-- closing panel above the footer on Blog, About and FAQ). Read and written
-- only through the service-role client, so RLS is on with no policies.
CREATE TABLE public.cms_blocks (
  key text PRIMARY KEY CHECK (key IN ('closing-panel')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cms_blocks_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cms_blocks_touch_updated_at
  BEFORE UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.cms_blocks_touch_updated_at();

INSERT INTO public.cms_blocks (key) VALUES ('closing-panel')
ON CONFLICT (key) DO NOTHING;
