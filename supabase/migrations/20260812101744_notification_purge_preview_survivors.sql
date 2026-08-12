-- =====================================================================================
-- count_notification_purge: also report what survives
-- =====================================================================================
-- The dialog this feeds showed only what would be deleted. An admin picked the
-- "Everything" cutoff, left the scope on its "My notifications" default, and read the
-- result as clearing the table. It deleted 141 of their own rows and kept every other
-- user's, which is exactly what was asked for and not at all what was meant. The page
-- then showed an empty list while notifications still held rows.
--
-- Two survivor numbers, deliberately separate, because one cannot describe both cases
-- honestly:
--
--   others_total   rows owned by anyone but the caller, ignoring the cutoff. This is
--                  the set the admin notifications page never displays, and the direct
--                  cause of the confusion.
--   remaining_total  everything this selection does not match. With scope self plus
--                  Everything that equals others_total, but with a dated cutoff it
--                  also contains the caller's own newer rows, so it must never be
--                  labelled "belonging to other users".
--
-- Same signature, so grants and the REVOKE from PUBLIC/anon carry over untouched.
-- purge_notifications is not modified.

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
    'total',           count(*) FILTER (WHERE matched),
    'unread',          count(*) FILTER (WHERE matched AND is_read IS NOT TRUE),
    'users',           count(DISTINCT user_id) FILTER (WHERE matched),
    'oldest',          min(created_at) FILTER (WHERE matched),
    'newest',          max(created_at) FILTER (WHERE matched),
    'remaining_total', count(*) FILTER (WHERE NOT matched),
    'others_total',    count(*) FILTER (WHERE NOT is_own),
    'others_users',    count(DISTINCT user_id) FILTER (WHERE NOT is_own)
  ) INTO v_result
  FROM (
    SELECT
      user_id,
      is_read,
      created_at,
      user_id = auth.uid() AS is_own,
      -- Kept character-for-character in step with the WHERE clause in
      -- purge_notifications. Change both or neither: the entire point of this
      -- function is that the number shown is the number deleted.
      ((p_all_users OR user_id = auth.uid())
        AND (p_before IS NULL OR created_at < p_before)) AS matched
    FROM notifications
  ) s;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.count_notification_purge IS
  'Read-only preview of what purge_notifications would remove for the same arguments. '
  'Admin only. Returns the matched set (total, unread, users, oldest, newest) plus what '
  'survives: remaining_total for this selection, and others_total/others_users for rows '
  'owned by anyone but the caller regardless of cutoff.';
