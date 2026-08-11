-- The operating timezone, for SQL that has to agree with the application about
-- what day it is.
--
-- The application reads this same value from site_settings via
-- lib/site-settings/timezone.ts. Postgres cannot read that, so anything doing
-- day or month arithmetic server-side has to come through here instead of
-- assuming the session timezone, which is UTC.
--
-- Guarded against a bad value: a zone Postgres does not recognise would make
-- every AT TIME ZONE below throw, so an unknown name falls back to Asia/Dubai
-- exactly as setBookingTimezone() does on the application side.
create or replace function public.platform_timezone()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.config ->> 'timezone'
      from site_settings s
      where s.config ->> 'timezone' in (select name from pg_timezone_names)
      limit 1
    ),
    'Asia/Dubai'
  );
$$;

comment on function public.platform_timezone() is
  'Operating timezone from site_settings, falling back to Asia/Dubai. Use for all day and month boundaries in SQL.';

grant execute on function public.platform_timezone() to authenticated, anon, service_role;
