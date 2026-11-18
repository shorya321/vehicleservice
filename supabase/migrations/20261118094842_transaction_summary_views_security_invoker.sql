-- Views ran as owner and bypassed wallet_transactions RLS (anon could read every tenant's totals).
-- With invoker rights the existing RLS ("Business users view own transactions", "Admins view all") applies.
alter view public.daily_transaction_summary   set (security_invoker = true);
alter view public.monthly_transaction_summary set (security_invoker = true);
revoke all on public.daily_transaction_summary, public.monthly_transaction_summary from anon;