-- Review fixes for the booking trash.
--
-- 1. swap_quotation_item_vehicle treated a line whose booking sits in the trash as open
--    (converted_booking_id is cleared there) and would reprice a line that was already
--    charged. It now also refuses a line with converted_booking_removed_at.
-- 2. A trip removed by a platform admin can only be restored by an admin. A business owner
--    restoring it would undo a platform decision (a fraudulent or erroneous booking).
--
-- Both are targeted text patches of the live definitions, each asserted to apply once.
DO $patch$
DECLARE
  def text;
  patched text;
BEGIN
  def := pg_get_functiondef('public.swap_quotation_item_vehicle(uuid, uuid)'::regprocedure);
  IF position('converted_booking_removed_at' IN def) = 0 THEN
    patched := replace(
      def,
      E'  if v_item.converted_booking_id is not null then\n',
      E'  if v_item.converted_booking_id is not null or v_item.converted_booking_removed_at is not null then\n'
    );
    IF patched = def THEN
      RAISE EXCEPTION 'swap_quotation_item_vehicle: booked guard not found';
    END IF;
    EXECUTE patched;
  END IF;

  def := pg_get_functiondef('public.restore_trashed_trip(uuid, uuid, uuid, text, text)'::regprocedure);
  IF position('deleted_by_role = ''admin''' IN def) = 0 THEN
    patched := replace(
      def,
      E'  IF t.expires_at < now() THEN\n',
      E'  IF p_business_account_id IS NOT NULL AND t.deleted_by_role = ''admin'' THEN\n'
      || E'    RAISE EXCEPTION ''This booking was removed by the platform team. Contact support to restore it.'';\n'
      || E'  END IF;\n'
      || E'  IF t.expires_at < now() THEN\n'
    );
    IF patched = def THEN
      RAISE EXCEPTION 'restore_trashed_trip: expiry check not found';
    END IF;
    EXECUTE patched;
  END IF;
END
$patch$;
