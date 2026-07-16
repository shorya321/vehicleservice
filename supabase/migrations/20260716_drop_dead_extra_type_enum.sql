-- Drop the dead `extra_type` enum
-- Date: 2026-07-16
-- Description: `extra_type` was never wired up to anything. It carried labels for services that
--              were never built — meet_greet, nameplate_service, extra_wait_time, priority_pickup,
--              wifi_hotspot — alongside duplicates of real addons rows (child_seat, premium_water,
--              newspapers, phone_charger).
--
--              Verified unused before dropping:
--                - information_schema.columns WHERE udt_name = 'extra_type'  -> 0 rows
--                - pg_depend (excluding internal deps)                       -> 0 dependents
--                - grep across app/ lib/ components/ supabase/               -> only the generated
--                                                                              lib/supabase/types.ts
--
--              Add-ons are modelled by the `addons` table (category + pricing_type), not by this
--              enum, so there is nothing to migrate onto.
--
--              No CASCADE, deliberately: if some dependency was missed, this errors out loudly
--              rather than silently dropping a column along with the type.

DROP TYPE IF EXISTS public.extra_type;
