# About this directory

**These files do not deploy the database. They are a written record, nothing
more.** Nothing in the app, the build or Vercel reads them - no code references
`supabase/migrations` at all.

## The actual state, measured 2026-08-12

| | count |
|---|---|
| `.sql` files here | 174 |
| migrations recorded in `supabase_migrations.schema_migrations` | 249 |
| files using Supabase's 14-digit version format | 19 |
| of those, actually recorded as applied | 12 |
| applied migrations with **no** file here | 244 |

Most files predate any convention and are named `001_user_roles.sql`,
`20240109_add_vehicle_categories.sql`, `20251103_fix_customer_name_trigger_error.sql`.
The Supabase CLI does not recognise those as versioned migrations.

## Do not run `supabase db push`

It would try to apply the files here against a schema that moved past them long
ago, while 244 applied changes are absent. Treat this directory as read-only
history.

Changes reach the database through the Supabase MCP `apply_migration` tool (or
the dashboard). That records a row in `supabase_migrations.schema_migrations`
and **writes no file here** - which is why the drift exists.

## If you apply a migration, mirror it correctly

`apply_migration` picks its own version from the server clock. Inventing a
timestamp for the local filename produces a file whose name matches the applied
migration but whose version does not - the exact drift this README documents.
Seven files had it before it was corrected, e.g.
`20260811120000_activity_trip_number_label.sql` for a migration applied as
`20260811101933`.

After applying, look the real version up and name the file with it:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 5;
```

```
supabase/migrations/<version>_<name>.sql   -- exactly as recorded
```

Keep the file's SQL byte-identical to what was applied.

## Files here that were never applied

Fourteen 14-digit files have no matching record, including the Oct 2025 theme
seeds (`20251014164319`, `20251014164802`-`164804`, `20251014170436`-`170437`).
Their rows did exist in the database, so they were applied out-of-band without
being recorded. Do not assume a file here ran, and do not assume a change in the
database has a file here.
