-- =====================================================================================
-- RPC Function: get_business_by_custom_domain
-- =====================================================================================
-- Purpose: Retrieve business account details by custom domain for middleware routing
-- Used by: middleware.ts for custom domain identification and branding injection
-- =====================================================================================

-- Drop existing function if it exists (may have different signature)
DROP FUNCTION IF EXISTS get_business_by_custom_domain(TEXT);

CREATE OR REPLACE FUNCTION get_business_by_custom_domain(p_domain TEXT)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  brand_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  subdomain TEXT,
  custom_domain TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ba.id,
    ba.business_name,
    ba.brand_name,
    ba.logo_url,
    ba.primary_color::TEXT,
    ba.secondary_color::TEXT,
    ba.accent_color::TEXT,
    ba.subdomain,
    ba.custom_domain
  FROM business_accounts ba
  WHERE ba.custom_domain = p_domain
    AND ba.custom_domain_verified = true
    AND ba.status = 'active'
  LIMIT 1;
END;
$$;

-- =====================================================================================
-- Grant execute permissions to authenticated and anon users
-- (Middleware runs with anon key for public routes)
-- =====================================================================================
GRANT EXECUTE ON FUNCTION get_business_by_custom_domain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_by_custom_domain(TEXT) TO anon;

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON FUNCTION get_business_by_custom_domain IS 'Returns business account details for a verified custom domain. Used by middleware for domain-based business identification and branding context injection.';
