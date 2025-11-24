# Auto-Recharge Setup Documentation

## ✅ Implementation Status: COMPLETE

**Date Implemented:** November 19, 2025
**Status:** Production Ready

---

## 📋 Overview

The auto-recharge system automatically tops up business wallet balances when they fall below a configured threshold. The system uses a **once-daily cron job** approach for reliability and efficiency.

---

## 🏗️ Architecture

### Components:

1. **Database Trigger** (`check_and_trigger_auto_recharge`)
   - Fires on `wallet_transactions` INSERT
   - Checks if balance below threshold
   - Creates `auto_recharge_attempt` record with status='pending'

2. **Vercel Cron Job** (`vercel.json`)
   - Runs **daily at 6:00 AM**
   - Calls `/api/business/wallet/auto-recharge/process-pending`
   - Processes all pending attempts

3. **Processor API** (`app/api/business/wallet/auto-recharge/process-pending/route.ts`)
   - Fetches pending attempts from database
   - Creates Stripe PaymentIntent (off_session mode)
   - Adds funds to wallet using `add_to_wallet()` RPC
   - Updates attempt status to 'succeeded' or handles retries

---

## ⚙️ Configuration

### Vercel Cron Schedule

File: `vercel.json`
```json
{
  "crons": [{
    "path": "/api/business/wallet/auto-recharge/process-pending",
    "schedule": "0 6 * * *"
  }]
}
```

**Schedule:** `0 6 * * *` (Every day at 6:00 AM)
**Executions:** 1 per day
**Vercel Limit:** 100/day (free tier) ✅

### Why 6:00 AM?
- Before business hours start
- Ensures wallet is topped up for the day
- Low server load
- Users won't notice processing delay

---

## 🔄 How It Works

### Flow Diagram:

```
1. Booking Deduction
   └─> Balance: $400 → $350 (below $400 threshold)
        │
2. Database Trigger Fires
   └─> Creates auto_recharge_attempt (status='pending')
        │
3. Next Day at 6:00 AM
   └─> Vercel Cron runs
        │
4. Processor API
   └─> Fetches pending attempts
   └─> Creates Stripe PaymentIntent
   └─> Confirms payment (off_session)
   └─> Adds funds to wallet via RPC
   └─> Updates attempt status='succeeded'
        │
5. Wallet Recharged
   └─> Balance: $350 → $360 (+$10)
```

---

## 🧪 Testing Results

### Test Date: November 19, 2025

**Scenario:**
- 4 pending attempts accumulated (Nov 13-17)
- Manually triggered processor API
- All attempts processed successfully

**Results:**
```
✅ Processed: 4 attempts
✅ Succeeded: 4 attempts
✅ Failed: 0 attempts
✅ Wallet balance: $275 → $315 (+$40)
✅ Stripe payments: All successful
```

### Verification Queries:

```sql
-- Check auto-recharge attempts
SELECT status, COUNT(*)
FROM auto_recharge_attempts
GROUP BY status;

-- Check wallet transactions
SELECT * FROM wallet_transactions
WHERE description LIKE '%Auto-recharge%'
ORDER BY created_at DESC;
```

---

## 👤 User Experience

### For Business Users:

1. **Configure auto-recharge** in wallet settings:
   - Set trigger threshold (e.g., $400)
   - Set recharge amount (e.g., $10)
   - Add payment method

2. **Balance monitoring:**
   - Balance drops below threshold
   - Auto-recharge triggers (recorded as pending)

3. **Manual option always available:**
   - Users can manually recharge anytime
   - No need to wait for daily cron

4. **Next morning:**
   - Cron runs at 6:00 AM
   - Wallet automatically topped up
   - Ready for business hours

---

## 📊 Monitoring

### Vercel Dashboard

1. Navigate to **Vercel Dashboard → Project → Cron Jobs**
2. View execution history
3. Check success/failure status
4. Monitor execution count (should be ~30/month)

### Database Monitoring

```sql
-- Check pending attempts
SELECT COUNT(*) FROM auto_recharge_attempts
WHERE status = 'pending';

-- Check failed attempts
SELECT * FROM auto_recharge_attempts
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Check monthly spending
SELECT * FROM auto_recharge_monthly_spending
WHERE business_account_id = 'YOUR_ID';
```

---

## 🚨 Troubleshooting

### Issue: Attempts stuck in 'pending' status

**Check:**
1. Is Vercel cron job running? (Check Vercel dashboard)
2. Is API endpoint accessible? (`curl https://yourdomain.com/api/business/wallet/auto-recharge/process-pending`)
3. Are there errors in Vercel logs?

**Fix:**
```bash
# Manually trigger processor
curl https://yourdomain.com/api/business/wallet/auto-recharge/process-pending
```

### Issue: Payments failing

**Check:**
1. Payment method still active?
2. Stripe customer ID valid?
3. Monthly limit reached?

**Query:**
```sql
SELECT * FROM auto_recharge_attempts
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔐 Security

- ✅ Payment method validation before processing
- ✅ Monthly spending limits enforced
- ✅ Idempotency keys prevent duplicate charges
- ✅ Stripe off_session mode (PCI compliant)
- ✅ RLS policies on all tables
- ✅ Retry logic with exponential backoff

---

## 📈 Future Enhancements

### Possible Improvements:
1. Email notifications (success/failure)
2. Slack/Discord webhook alerts
3. Dashboard widget showing auto-recharge status
4. Dynamic threshold based on usage patterns
5. Multiple payment method fallback

---

## 📝 Related Documentation

- `docs/AUTO_RECHARGE_FIX_COMPLETE.md` - Original implementation details
- `supabase/migrations/20251107_add_auto_recharge.sql` - Database schema
- `supabase/migrations/20251111_fix_auto_recharge_trigger.sql` - Trigger fix
- `app/api/business/wallet/auto-recharge/process-pending/route.ts` - Processor code

---

## ✅ Deployment Checklist

Before deploying to production:

- [x] vercel.json created with cron configuration
- [x] Database migrations applied
- [x] Processor API tested manually
- [x] Payment methods configured for test business
- [x] Stripe integration verified
- [ ] Deploy to Vercel
- [ ] Verify cron job appears in Vercel dashboard
- [ ] Monitor first execution at 6:00 AM
- [ ] Check logs for any errors

---

## 📞 Support

For issues or questions:
1. Check Vercel cron job logs
2. Query database for pending/failed attempts
3. Manually trigger processor API for testing
4. Review Stripe dashboard for payment status

---

**Last Updated:** November 19, 2025
**Maintained By:** Development Team
