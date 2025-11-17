/**
 * Transaction Filters and Statistics Enhancement
 * Adds indexes, views, and functions for advanced transaction filtering,
 * export capabilities, and statistical analysis
 */

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for date range queries with business filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_business_date
  ON wallet_transactions(business_account_id, created_at DESC);

-- Composite index for type + date filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_business_type_date
  ON wallet_transactions(business_account_id, transaction_type, created_at DESC);

-- Index for amount range queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_business_amount
  ON wallet_transactions(business_account_id, amount);

-- Index for currency filtering
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_business_currency
  ON wallet_transactions(business_account_id, currency);

-- Composite index for full-text search on description
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_description_search
  ON wallet_transactions USING gin(to_tsvector('english', description));

-- ============================================================================
-- TRANSACTION STATISTICS FUNCTION
-- ============================================================================

/**
 * Calculate comprehensive transaction statistics for a business account
 * with optional filtering by date range, transaction type, and amount range
 */
CREATE OR REPLACE FUNCTION get_transaction_statistics(
  p_business_account_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_transaction_types TEXT[] DEFAULT NULL,
  p_min_amount DECIMAL DEFAULT NULL,
  p_max_amount DECIMAL DEFAULT NULL,
  p_currency VARCHAR(3) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_query TEXT;
BEGIN
  -- Build dynamic query based on filters
  v_query := '
    SELECT json_build_object(
      ''total_transactions'', COUNT(*),
      ''total_credits'', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
      ''total_debits'', COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0),
      ''net_amount'', COALESCE(SUM(amount), 0),
      ''average_transaction'', COALESCE(AVG(amount), 0),
      ''largest_credit'', COALESCE(MAX(CASE WHEN amount > 0 THEN amount END), 0),
      ''largest_debit'', COALESCE(ABS(MIN(CASE WHEN amount < 0 THEN amount END)), 0),
      ''by_type'', (
        SELECT json_object_agg(
          transaction_type,
          json_build_object(
            ''count'', count,
            ''total_amount'', total_amount
          )
        )
        FROM (
          SELECT
            transaction_type,
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM wallet_transactions
          WHERE business_account_id = $1';

  -- Add date filters
  IF p_start_date IS NOT NULL THEN
    v_query := v_query || ' AND created_at >= $2';
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_query := v_query || ' AND created_at <= $3';
  END IF;

  -- Add type filter
  IF p_transaction_types IS NOT NULL THEN
    v_query := v_query || ' AND transaction_type = ANY($4)';
  END IF;

  -- Add amount filters
  IF p_min_amount IS NOT NULL THEN
    v_query := v_query || ' AND amount >= $5';
  END IF;

  IF p_max_amount IS NOT NULL THEN
    v_query := v_query || ' AND amount <= $6';
  END IF;

  -- Add currency filter
  IF p_currency IS NOT NULL THEN
    v_query := v_query || ' AND currency = $7';
  END IF;

  v_query := v_query || '
          GROUP BY transaction_type
        ) type_stats
      ),
      ''by_currency'', (
        SELECT json_object_agg(
          currency,
          json_build_object(
            ''count'', count,
            ''total_amount'', total_amount
          )
        )
        FROM (
          SELECT
            currency,
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM wallet_transactions
          WHERE business_account_id = $1';

  -- Add same filters for currency aggregation
  IF p_start_date IS NOT NULL THEN
    v_query := v_query || ' AND created_at >= $2';
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_query := v_query || ' AND created_at <= $3';
  END IF;

  IF p_transaction_types IS NOT NULL THEN
    v_query := v_query || ' AND transaction_type = ANY($4)';
  END IF;

  IF p_min_amount IS NOT NULL THEN
    v_query := v_query || ' AND amount >= $5';
  END IF;

  IF p_max_amount IS NOT NULL THEN
    v_query := v_query || ' AND amount <= $6';
  END IF;

  IF p_currency IS NOT NULL THEN
    v_query := v_query || ' AND currency = $7';
  END IF;

  v_query := v_query || '
          GROUP BY currency
        ) currency_stats
      )
    )
    FROM wallet_transactions
    WHERE business_account_id = $1';

  -- Add filters again for main query
  IF p_start_date IS NOT NULL THEN
    v_query := v_query || ' AND created_at >= $2';
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_query := v_query || ' AND created_at <= $3';
  END IF;

  IF p_transaction_types IS NOT NULL THEN
    v_query := v_query || ' AND transaction_type = ANY($4)';
  END IF;

  IF p_min_amount IS NOT NULL THEN
    v_query := v_query || ' AND amount >= $5';
  END IF;

  IF p_max_amount IS NOT NULL THEN
    v_query := v_query || ' AND amount <= $6';
  END IF;

  IF p_currency IS NOT NULL THEN
    v_query := v_query || ' AND currency = $7';
  END IF;

  -- Execute with parameters
  EXECUTE v_query INTO v_result
    USING p_business_account_id, p_start_date, p_end_date, p_transaction_types,
          p_min_amount, p_max_amount, p_currency;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- ============================================================================
-- MONTHLY TRANSACTION SUMMARY VIEW
-- ============================================================================

/**
 * View for monthly transaction summaries by business and currency
 */
CREATE OR REPLACE VIEW monthly_transaction_summary AS
SELECT
  business_account_id,
  DATE_TRUNC('month', created_at) AS month,
  currency,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_credits,
  ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)) AS total_debits,
  SUM(amount) AS net_amount,
  AVG(amount) AS avg_transaction,
  COUNT(*) FILTER (WHERE transaction_type = 'credit_added') AS credit_added_count,
  COUNT(*) FILTER (WHERE transaction_type = 'booking_deduction') AS booking_deduction_count,
  COUNT(*) FILTER (WHERE transaction_type = 'refund') AS refund_count,
  COUNT(*) FILTER (WHERE transaction_type = 'admin_adjustment') AS admin_adjustment_count
FROM wallet_transactions
GROUP BY business_account_id, DATE_TRUNC('month', created_at), currency;

-- ============================================================================
-- DAILY TRANSACTION SUMMARY VIEW
-- ============================================================================

/**
 * View for daily transaction summaries by business and currency
 */
CREATE OR REPLACE VIEW daily_transaction_summary AS
SELECT
  business_account_id,
  DATE_TRUNC('day', created_at) AS day,
  currency,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_credits,
  ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)) AS total_debits,
  SUM(amount) AS net_amount,
  AVG(amount) AS avg_transaction
FROM wallet_transactions
GROUP BY business_account_id, DATE_TRUNC('day', created_at), currency;

-- ============================================================================
-- TRANSACTION EXPORT FUNCTION
-- ============================================================================

/**
 * Function to retrieve transactions for export with all fields formatted
 * Returns transactions in a format suitable for CSV/Excel export
 */
CREATE OR REPLACE FUNCTION export_transactions(
  p_business_account_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_transaction_types TEXT[] DEFAULT NULL,
  p_currency VARCHAR(3) DEFAULT NULL,
  p_limit INTEGER DEFAULT 10000
)
RETURNS TABLE (
  transaction_id UUID,
  transaction_date TIMESTAMPTZ,
  transaction_type TEXT,
  description TEXT,
  amount DECIMAL(12, 2),
  currency VARCHAR(3),
  balance_after DECIMAL(12, 2),
  reference_id UUID,
  stripe_payment_intent_id TEXT,
  created_by TEXT,
  original_amount DECIMAL(12, 2),
  original_currency VARCHAR(3),
  exchange_rate DECIMAL(10, 6)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.id AS transaction_id,
    wt.created_at AS transaction_date,
    wt.transaction_type,
    wt.description,
    wt.amount,
    wt.currency,
    wt.balance_after,
    wt.reference_id,
    wt.stripe_payment_intent_id,
    wt.created_by,
    wt.original_amount,
    wt.original_currency,
    wt.exchange_rate
  FROM wallet_transactions wt
  WHERE wt.business_account_id = p_business_account_id
    AND (p_start_date IS NULL OR wt.created_at >= p_start_date)
    AND (p_end_date IS NULL OR wt.created_at <= p_end_date)
    AND (p_transaction_types IS NULL OR wt.transaction_type = ANY(p_transaction_types))
    AND (p_currency IS NULL OR wt.currency = p_currency)
  ORDER BY wt.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- SEARCH TRANSACTIONS FUNCTION
-- ============================================================================

/**
 * Full-text search function for transaction descriptions
 */
CREATE OR REPLACE FUNCTION search_transactions(
  p_business_account_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  transaction_id UUID,
  transaction_date TIMESTAMPTZ,
  transaction_type TEXT,
  description TEXT,
  amount DECIMAL(12, 2),
  currency VARCHAR(3),
  balance_after DECIMAL(12, 2),
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.id AS transaction_id,
    wt.created_at AS transaction_date,
    wt.transaction_type,
    wt.description,
    wt.amount,
    wt.currency,
    wt.balance_after,
    ts_rank(to_tsvector('english', wt.description), plainto_tsquery('english', p_search_query)) AS rank
  FROM wallet_transactions wt
  WHERE wt.business_account_id = p_business_account_id
    AND to_tsvector('english', wt.description) @@ plainto_tsquery('english', p_search_query)
  ORDER BY rank DESC, wt.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_transaction_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION export_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION search_transactions TO authenticated;

-- Note: Views will inherit RLS from underlying table (wallet_transactions)
