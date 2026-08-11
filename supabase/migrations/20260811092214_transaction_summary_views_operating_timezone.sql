-- Bucket transaction summaries by the operating timezone's day and month.
--
-- date_trunc on a timestamptz truncates in the session timezone, which is UTC,
-- so every transaction between midnight and 04:00 Dubai was filed under the
-- previous day's bar and the first four hours of the 1st under the previous
-- month. Converting into the zone, truncating there, then converting back keeps
-- the column a timestamptz holding the instant that Dubai day began, so
-- consumers comparing against a Dubai midnight (bookingDaysAgoUtc) line up
-- exactly and no column type changes.
--
-- The timezone is read once via a cross join rather than per row.

create or replace view public.daily_transaction_summary as
select
  t.business_account_id,
  date_trunc('day', t.created_at AT TIME ZONE c.tz) AT TIME ZONE c.tz as day,
  t.currency,
  count(*) as transaction_count,
  sum(case when t.amount > 0::numeric then t.amount else 0::numeric end) as total_credits,
  abs(sum(case when t.amount < 0::numeric then t.amount else 0::numeric end)) as total_debits,
  sum(t.amount) as net_amount,
  avg(t.amount) as avg_transaction
from wallet_transactions t
cross join (select public.platform_timezone() as tz) c
group by t.business_account_id, date_trunc('day', t.created_at AT TIME ZONE c.tz) AT TIME ZONE c.tz, t.currency;

create or replace view public.monthly_transaction_summary as
select
  t.business_account_id,
  date_trunc('month', t.created_at AT TIME ZONE c.tz) AT TIME ZONE c.tz as month,
  t.currency,
  count(*) as transaction_count,
  sum(case when t.amount > 0::numeric then t.amount else 0::numeric end) as total_credits,
  abs(sum(case when t.amount < 0::numeric then t.amount else 0::numeric end)) as total_debits,
  sum(t.amount) as net_amount,
  avg(t.amount) as avg_transaction,
  count(*) filter (where t.transaction_type = 'credit_added'::text) as credit_added_count,
  count(*) filter (where t.transaction_type = 'booking_deduction'::text) as booking_deduction_count,
  count(*) filter (where t.transaction_type = 'refund'::text) as refund_count,
  count(*) filter (where t.transaction_type = 'admin_adjustment'::text) as admin_adjustment_count
from wallet_transactions t
cross join (select public.platform_timezone() as tz) c
group by t.business_account_id, date_trunc('month', t.created_at AT TIME ZONE c.tz) AT TIME ZONE c.tz, t.currency;
