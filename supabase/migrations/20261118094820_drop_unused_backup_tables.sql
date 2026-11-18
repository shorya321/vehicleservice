-- Hand-made undo snapshots from the 2026-11-12..14 zone/search work.
-- No FK, view, function, trigger, policy, cron or app code references them.
-- Exported to backups/2026-11-18-undo-tables/*.json (local) before dropping.
drop table public.backup_airport_types_20261114,
  public.backup_fn_search_locations_20261114,
  public.backup_locations_city_20261112,
  public.backup_locations_zone_20261113,
  public.backup_locations_zone_dubai_20261113,
  public.backup_routes_distance_20261114,
  public.backup_saadiyat_zone_20261114,
  public.backup_search_fix_aliases_20261114,
  public.backup_search_fix_locations_20261114,
  public.backup_zone_ids_remote_20261114;