/**
 * Auto-Recharge Processor Edge Function — DISABLED
 *
 * This edge function is deprecated and intentionally neutralized.
 *
 * Why:
 * - It was superseded by the Next.js cron route
 *   `app/api/business/wallet/auto-recharge/process-pending` (scheduled in
 *   vercel.json), which is the canonical auto-recharge path.
 * - Its previous implementation was non-functional (called `add_to_wallet`
 *   with the wrong parameters, inserted a nonexistent `payment_intent_id`
 *   column, omitted the NOT-NULL `balance_after`, and set the Stripe `customer`
 *   to a connected-account id) and was guarded only by the public anon key with
 *   `Access-Control-Allow-Origin: *` — a real off-session card-charging risk.
 *
 * All requests now return HTTP 410 Gone without touching Stripe or the database.
 * To fully remove it, delete the deployed function in the Supabase dashboard
 * (or via `supabase functions delete auto-recharge-processor`).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(() =>
  new Response(
    JSON.stringify({
      error: 'Gone',
      message:
        'auto-recharge-processor is disabled. Auto-recharge is handled by /api/business/wallet/auto-recharge/process-pending.',
    }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  )
)
