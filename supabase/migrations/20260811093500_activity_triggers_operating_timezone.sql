-- Stop freezing UTC-formatted timestamps into user-facing text.
--
-- These triggers call to_char() on a timestamptz with no zone, so the string is
-- rendered in the session timezone (UTC) and then stored. The activity feed and
-- the vendor notification render that string verbatim, so a pickup at 12:00
-- Dubai was shown to the reader as 08:00, permanently, with no way to correct
-- it at display time.
--
-- The rewrite is done by substitution on the live definition rather than by
-- restating the bodies, so nothing but the timezone can change. Each step
-- asserts that its replacement actually matched.

do $$
declare
  v_def text;
  v_new text;
begin
  -- 1. Reschedule audit strings.
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'log_business_booking_reschedule';

  v_new := replace(
    replace(
      v_def,
      'to_char(NEW.previous_datetime, ''DD Mon YYYY at HH24:MI'')',
      'to_char(NEW.previous_datetime AT TIME ZONE platform_timezone(), ''DD Mon YYYY at HH24:MI'')'
    ),
    'to_char(NEW.new_datetime, ''DD Mon YYYY at HH24:MI'')',
    'to_char(NEW.new_datetime AT TIME ZONE platform_timezone(), ''DD Mon YYYY at HH24:MI'')'
  );

  if v_new = v_def then
    raise exception 'log_business_booking_reschedule: no substitution matched';
  end if;
  execute v_new;

  -- 2. Booking-created pickup clause.
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'create_booking_with_wallet_deduction';

  v_new := replace(
    v_def,
    'to_char(p_pickup_datetime, ''DD Mon YYYY at HH24:MI'')',
    'to_char(p_pickup_datetime AT TIME ZONE platform_timezone(), ''DD Mon YYYY at HH24:MI'')'
  );

  if v_new = v_def then
    raise exception 'create_booking_with_wallet_deduction: no substitution matched';
  end if;
  execute v_new;

  -- 3. Vendor notification body. This one pinned UTC explicitly, so a vendor was
  --    told the new pickup was four hours earlier than it is.
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'notify_booking_datetime_modified';

  v_new := replace(
    v_def,
    'NEW.new_datetime AT TIME ZONE ''UTC''',
    'NEW.new_datetime AT TIME ZONE platform_timezone()'
  );

  if v_new = v_def then
    raise exception 'notify_booking_datetime_modified: no substitution matched';
  end if;
  execute v_new;
end $$;
