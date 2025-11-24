-- Password Reset Tokens Table for Business Module
-- Stores secure tokens for password reset with domain context

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Information
  email TEXT NOT NULL,
  business_account_id UUID REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Token Details
  token TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,  -- Preserve domain context (main/subdomain/custom)

  -- Token Lifecycle
  expires_at TIMESTAMPTZ NOT NULL,  -- Tokens expire after 1 hour
  used_at TIMESTAMPTZ,               -- Mark when token is used

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_business ON password_reset_tokens(business_account_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Cleanup function to delete expired tokens (run daily via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete tokens older than 24 hours
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE password_reset_tokens IS 'Stores secure password reset tokens with domain context for business module';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token (64 chars hex from crypto.randomBytes(32))';
COMMENT ON COLUMN password_reset_tokens.domain IS 'Original domain where reset was requested (preserves white-label context)';
COMMENT ON COLUMN password_reset_tokens.business_account_id IS 'Business that owns the email (for audit and security validation)';
