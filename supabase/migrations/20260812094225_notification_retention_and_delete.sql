-- =====================================================================================
-- Notifications: retention, per-user delete, admin purge
-- =====================================================================================
-- The notifications table shipped with no delete path at all: no DELETE policy, no
-- purge function, no scheduled job. It only ever grew. create_admin_notification()
-- fans one row out to every verified admin, and roughly twenty triggers call it, so
-- admin rows dominate and nothing ever removed them.
--
-- Three separate concerns, three separate functions:
--   prune_notifications       automatic retention, service_role only, cron driven
--   delete_notification       one row, the caller's own
--   clear_read_notifications  the caller's read rows, optionally one category
--   count_notification_purge  what an admin purge would remove, read only
--   purge_notifications       the admin purge itself, audited
--
-- All of them are SECURITY DEFINER rather than relying on a FOR DELETE policy,
-- matching purge_business_activity. Authorization is therefore checked inside each
-- function, because SECURITY DEFINER bypasses RLS entirely.

-- =====================================================================================
-- Automatic retention
-- =====================================================================================
-- Read rows have served their purpose and go at 90 days. Unread rows might still be
-- acted on, so they get a longer grace at 180. The per-user cap is the backstop for a
-- single account that receives far more than the rest inside the retention window.
--
-- Keyed on created_at, never read_at: three customer-side call sites set is_read
-- without setting read_at, so read_at is NULL for a real share of read rows and a
-- rule keyed on it would skip them forever.
--
-- is_read is nullable, hence IS TRUE / IS NOT TRUE. Bare is_read / NOT is_read would
-- let a NULL row fall through both branches and never be collected.

CREATE OR REPLACE FUNCTION public.prune_notifications(
  p_read_retention_days   integer DEFAULT 90,
  p_unread_retention_days integer DEFAULT 180,
  p_max_rows_per_user     integer DEFAULT 500
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_read   integer := 0;
  v_unread integer := 0;
  v_capped integer := 0;
BEGIN
  DELETE FROM notifications
  WHERE is_read IS TRUE
    AND created_at < now() - make_interval(days => GREATEST(p_read_retention_days, 7));
  GET DIAGNOSTICS v_read = ROW_COUNT;

  DELETE FROM notifications
  WHERE is_read IS NOT TRUE
    AND created_at < now() - make_interval(days => GREATEST(p_unread_retention_days, 30));
  GET DIAGNOSTICS v_unread = ROW_COUNT;

  WITH ranked AS (
    SELECT id, row_number() OVER (
      PARTITION BY user_id ORDER BY created_at DESC
    ) AS rn
    FROM notifications
  )
  DELETE FROM notifications n
  USING ranked r
  WHERE n.id = r.id
    AND r.rn > GREATEST(p_max_rows_per_user, 100);
  GET DIAGNOSTICS v_capped = ROW_COUNT;

  RETURN v_read + v_unread + v_capped;
EXCEPTION WHEN OTHERS THEN
  -- Housekeeping must never take a cron route down.
  RAISE WARNING 'prune_notifications failed: %', SQLERRM;
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_notifications(integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_notifications(integer, integer, integer)
  TO service_role;

COMMENT ON FUNCTION public.prune_notifications IS
  'Deletes read notifications older than p_read_retention_days (floor 7) and unread ones '
  'older than p_unread_retention_days (floor 30), then trims each user to their newest '
  'p_max_rows_per_user rows (floor 100). Returns the number of rows removed.';

-- =====================================================================================
-- Per-user delete
-- =====================================================================================
-- Scoped to auth.uid() inside the function, with no user id parameter. Deliberate:
-- mark_all_notifications_read takes a caller-supplied p_user_id and is SECURITY
-- DEFINER, which lets any authenticated user touch another user's rows. That shape
-- must not be repeated for anything that deletes.

CREATE OR REPLACE FUNCTION public.delete_notification(p_notification_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF p_notification_id IS NULL THEN
    RETURN 0;
  END IF;

  DELETE FROM notifications
  WHERE id = p_notification_id
    AND user_id = auth.uid();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_read_notifications(
  p_category notification_category DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  DELETE FROM notifications
  WHERE user_id = auth.uid()
    AND is_read IS TRUE
    AND (p_category IS NULL OR category = p_category);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_notification(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_notification(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.clear_read_notifications(notification_category)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_read_notifications(notification_category)
  TO authenticated;

COMMENT ON FUNCTION public.delete_notification IS
  'Deletes one notification belonging to auth.uid(). Returns 1 if it was removed, 0 if '
  'it does not exist or belongs to someone else.';
COMMENT ON FUNCTION public.clear_read_notifications IS
  'Deletes the calling user read notifications, optionally limited to one category. '
  'Returns the number of rows removed.';

-- =====================================================================================
-- Admin purge
-- =====================================================================================
-- The count and the delete take identical parameters and share the same predicate, so
-- the number the dialog shows is the number that gets removed. Keep them in step: any
-- change to one WHERE clause has to be made to the other.
--
-- p_before NULL means no age limit, which is the "Everything" option.

CREATE OR REPLACE FUNCTION public.count_notification_purge(
  p_before    timestamptz DEFAULT NULL,
  p_all_users boolean     DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to purge notifications';
  END IF;

  IF p_before > now() THEN
    RAISE EXCEPTION 'Cutoff date cannot be in the future';
  END IF;

  SELECT jsonb_build_object(
    'total',  count(*),
    'unread', count(*) FILTER (WHERE is_read IS NOT TRUE),
    'users',  count(DISTINCT user_id),
    'oldest', min(created_at),
    'newest', max(created_at)
  ) INTO v_result
  FROM notifications
  WHERE (p_all_users OR user_id = auth.uid())
    AND (p_before IS NULL OR created_at < p_before);

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_notifications(
  p_before    timestamptz DEFAULT NULL,
  p_all_users boolean     DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to purge notifications';
  END IF;

  IF p_before > now() THEN
    RAISE EXCEPTION 'Cutoff date cannot be in the future';
  END IF;

  DELETE FROM notifications
  WHERE (p_all_users OR user_id = auth.uid())
    AND (p_before IS NULL OR created_at < p_before);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Never silent, same stance as the activity.purged row the business purge leaves.
  INSERT INTO user_activity_logs (user_id, action, details, created_by)
  VALUES (
    auth.uid(),
    'notifications_purged',
    jsonb_build_object(
      'rows_deleted', v_deleted,
      'cutoff',       p_before,
      'scope',        CASE WHEN p_all_users THEN 'all_users' ELSE 'self' END
    ),
    auth.uid()
  );

  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.count_notification_purge(timestamptz, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_notification_purge(timestamptz, boolean)
  TO authenticated;

REVOKE ALL ON FUNCTION public.purge_notifications(timestamptz, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_notifications(timestamptz, boolean)
  TO authenticated;

COMMENT ON FUNCTION public.count_notification_purge IS
  'Read-only preview of what purge_notifications would remove for the same arguments. '
  'Admin only. Returns total, unread, users, oldest and newest as jsonb.';
COMMENT ON FUNCTION public.purge_notifications IS
  'Admin purge of notifications older than p_before (NULL means every row), scoped to '
  'the calling admin unless p_all_users. Writes a notifications_purged row to '
  'user_activity_logs. Returns the number of rows removed.';
