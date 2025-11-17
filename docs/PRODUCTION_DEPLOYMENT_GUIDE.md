# Production Deployment Guide - VIK-29

**Project**: VIK-29 Business Wallet Enhancement
**Phase**: Production Deployment
**Version**: 1.0.0
**Date**: November 7, 2025

---

## ⚠️ CRITICAL WARNING

**This is a PRODUCTION deployment guide. Exercise extreme caution.**

- ❌ DO NOT proceed without complete staging validation
- ❌ DO NOT skip any safety checks
- ❌ DO NOT deploy during peak traffic hours
- ❌ DO NOT deploy without tested rollback plan
- ✅ DO have backup of production database
- ✅ DO have DevOps team on standby
- ✅ DO have communication plan ready
- ✅ DO deploy during maintenance window

---

## Table of Contents

1. [Pre-Production Requirements](#pre-production-requirements)
2. [Deployment Schedule](#deployment-schedule)
3. [Environment Setup](#environment-setup)
4. [Database Migration](#database-migration)
5. [Application Deployment](#application-deployment)
6. [Verification & Testing](#verification--testing)
7. [Gradual Rollout Strategy](#gradual-rollout-strategy)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Rollback Procedures](#rollback-procedures)
10. [Post-Deployment](#post-deployment)
11. [Incident Response](#incident-response)

---

## Pre-Production Requirements

### Mandatory Prerequisites

**DO NOT PROCEED unless ALL items are checked:**

- [ ] **1.1** Staging deployment completed successfully
- [ ] **1.2** Full regression testing passed (150+ tests)
  - Reference: `/docs/BATCH_4_REGRESSION_TESTING_CHECKLIST.md`
- [ ] **1.3** Staging running stable for 48+ hours minimum
- [ ] **1.4** No critical bugs identified in staging
- [ ] **1.5** All automated tests passing (130+ tests)
- [ ] **1.6** Performance testing completed and acceptable
- [ ] **1.7** Security audit completed (if required)
- [ ] **1.8** Load testing passed (50+ concurrent users)
- [ ] **1.9** QA sign-off obtained
- [ ] **1.10** Product Manager approval received
- [ ] **1.11** Stakeholder approval received

### Risk Assessment

**Overall Risk**: [ ] Low [ ] Medium [ ] High

**Risk Factors**:
- New payment processing system (Stripe Connect)
- Multi-tenant architecture changes
- Database schema modifications
- External service dependencies

**Mitigation**:
- ✅ Comprehensive testing completed
- ✅ Gradual rollout strategy in place
- ✅ Rollback plan tested
- ✅ 24/7 monitoring configured

---

## Deployment Schedule

### Recommended Deployment Window

**Day**: _____________ (Preferred: Tuesday-Thursday)
**Time**: _____________ (Preferred: 2:00 AM - 4:00 AM local time)
**Duration**: 3-4 hours (deployment + verification)

**Avoid**:
- ❌ Mondays (issues discovered over weekend)
- ❌ Fridays (limited support availability)
- ❌ Weekends (reduced team availability)
- ❌ Peak traffic hours (10 AM - 6 PM)
- ❌ Before holidays

### Team Availability

**Required Personnel**:
- [ ] Deployment Lead: _________________________
- [ ] Backend Engineer: _________________________
- [ ] DevOps Engineer: _________________________
- [ ] QA Lead: _________________________
- [ ] Database Administrator: _________________________
- [ ] Product Manager: _________________________
- [ ] On-Call Support: _________________________

**Contact Information**:
- Primary Phone: _________________________
- Secondary Phone: _________________________
- Slack Channel: #production-deployment
- Video Conference: _________________________

### Communication Plan

**T-72 hours (3 days before)**:
- [ ] Announce deployment window to all teams
- [ ] Notify customers via status page (if applicable)
- [ ] Schedule team briefing
- [ ] Confirm all personnel availability

**T-24 hours (1 day before)**:
- [ ] Final deployment briefing
- [ ] Verify all prerequisites
- [ ] Confirm rollback plan
- [ ] Test communication channels

**T-4 hours (deployment start)**:
- [ ] Team assembles
- [ ] Final go/no-go decision
- [ ] Begin deployment

**T+0 (deployment complete)**:
- [ ] Verify all systems operational
- [ ] Update status page
- [ ] Notify stakeholders

**T+24 hours (next day)**:
- [ ] Monitor for issues
- [ ] Review metrics
- [ ] Debrief meeting

---

## Environment Setup

### Production Stripe Account

**⚠️ CRITICAL: Use LIVE Stripe keys, not test keys**

1. **Create Production Stripe Account** (if not exists)
   - Log in to Stripe: https://dashboard.stripe.com
   - Switch to **Production** mode (toggle in top-left)
   - Complete business verification
   - Connect bank account for payouts

2. **Configure Stripe Connect**
   - Navigate to: **Connect → Settings**
   - Complete Connect onboarding
   - Add production redirect URI: `https://[production-domain]/api/business/stripe/callback`
   - Record **Client ID**: `ca_...` (LIVE mode)

3. **Generate API Keys**
   - Navigate to: **Developers → API keys**
   - Record:
     - **Publishable key**: `pk_live_...`
     - **Secret key**: `sk_live_...` (⚠️ Handle with extreme care)

4. **Configure Webhooks**
   - Navigate to: **Developers → Webhooks**
   - Click **Add endpoint**
   - Endpoint URL: `https://[production-domain]/api/business/wallet/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_method.attached`
     - `payment_method.detached`
   - Save endpoint
   - Record **Signing secret**: `whsec_...` (LIVE mode)

### Production Supabase Project

1. **Create Production Project**
   - Log in to Supabase: https://app.supabase.com
   - Create new project: `vehicleservice-production`
   - Select region: [closest to users]
   - Set **strong** database password (24+ characters)
   - Wait for provisioning

2. **Record Credentials**
   - **Project URL**: `https://[project-ref].supabase.co`
   - **Anon key**: `eyJ...`
   - **Service role key**: `eyJ...` (⚠️ Never expose client-side)
   - **Connection string**: `postgresql://postgres:[password]@[host]:5432/postgres`

3. **Configure Security**
   - Enable RLS on all tables
   - Configure email templates
   - Set up SMTP (Resend)
   - Configure JWT expiry
   - Enable audit logging

### Production Environment Variables

**Create `/etc/vehicleservice-production/.env.production`**:

```bash
# ============================================
# PRODUCTION ENVIRONMENT - HANDLE WITH CARE
# ============================================

# NEXT.JS CONFIGURATION
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://[production-domain]

# SUPABASE CONFIGURATION (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://[production-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=eyJ[production-service-role-key]
DATABASE_URL=postgresql://postgres:[production-password]@[production-host]:5432/postgres

# STRIPE CONFIGURATION (LIVE MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[production-publishable-key]
STRIPE_SECRET_KEY=sk_live_[production-secret-key]
STRIPE_CONNECT_CLIENT_ID=ca_[production-client-id]
STRIPE_WEBHOOK_SECRET=whsec_[production-webhook-secret]

# ENCRYPTION & SECURITY (UNIQUE FOR PRODUCTION)
# Generate NEW keys for production (DO NOT reuse staging keys)
ENCRYPTION_KEY=[generate-new-32-byte-base64-key]
STATE_SECRET=[generate-new-random-hex-string]

# EMAIL CONFIGURATION (PRODUCTION)
RESEND_API_KEY=re_[production-resend-key]
NEXT_PUBLIC_FROM_EMAIL=noreply@[production-domain]

# BUSINESS ACCOUNT DEFAULTS
DEFAULT_WALLET_BALANCE=0
AUTO_RECHARGE_ENABLED=false
AUTO_RECHARGE_THRESHOLD=100
AUTO_RECHARGE_AMOUNT=1000

# FEATURE FLAGS
ENABLE_CUSTOM_DOMAINS=true
ENABLE_AUTO_RECHARGE=true
ENABLE_MULTI_CURRENCY=true

# MONITORING & LOGGING (PRODUCTION)
LOG_LEVEL=warn
ENABLE_PERFORMANCE_MONITORING=true
SENTRY_DSN=https://[production-sentry-dsn]@sentry.io/[project]
SENTRY_ENVIRONMENT=production

# RATE LIMITING (PRODUCTION)
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST=200
```

**⚠️ SECURITY CHECKLIST**:
- [ ] All keys are PRODUCTION/LIVE keys (not test/staging)
- [ ] ENCRYPTION_KEY is unique (not reused from staging)
- [ ] STATE_SECRET is unique (not reused from staging)
- [ ] Service role key never exposed client-side
- [ ] Stripe secret key never exposed client-side
- [ ] Environment file permissions set to 600 (read/write owner only)
  ```bash
  chmod 600 /etc/vehicleservice-production/.env.production
  ```
- [ ] Environment file owner is application user
  ```bash
  chown www-data:www-data /etc/vehicleservice-production/.env.production
  ```

---

## Database Migration

### Step 1: Pre-Migration Backup

**⚠️ CRITICAL: Always backup before migration**

```bash
# Connect to production database
export PROD_DB_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Create comprehensive backup
pg_dump "$PROD_DB_URL" > production_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file size (should be > 0)
ls -lh production_backup_*.sql

# Test backup restore (on test database)
# pg_restore -d test_db production_backup_*.sql

# Upload backup to secure storage (S3, etc.)
aws s3 cp production_backup_*.sql s3://[backup-bucket]/$(date +%Y%m%d)/
```

**Verification**:
- [ ] Backup file created
- [ ] Backup file size > 0 bytes
- [ ] Backup uploaded to secure storage
- [ ] Backup can be restored (tested on non-production DB)

### Step 2: Maintenance Mode (Optional)

```bash
# Enable maintenance mode
# Create maintenance page or API response
touch /var/www/vehicleservice/MAINTENANCE_MODE

# Nginx can detect this and show maintenance page
```

### Step 3: Run Migrations

**Migration Plan**:

1. **Review Migration Files**:
   ```bash
   ls -la supabase/migrations/ | grep 202501
   ```

2. **Dry Run (Highly Recommended)**:
   ```bash
   # Test migrations on copy of production data
   pg_restore -d test_db production_backup_*.sql
   npx supabase db push --db-url "postgresql://test_db_connection_string"
   ```

3. **Execute Production Migrations**:
   ```bash
   # Set database URL
   export DATABASE_URL=$PROD_DB_URL

   # Run migrations
   npx supabase db push --db-url "$DATABASE_URL"

   # Alternative: Manual execution
   psql "$DATABASE_URL" < supabase/migrations/20250103_create_business_accounts.sql
   psql "$DATABASE_URL" < supabase/migrations/20250107_create_business_profiles.sql
   # ... run all migrations in order
   ```

4. **Verify Migrations**:
   ```sql
   -- Connect to database
   psql "$DATABASE_URL"

   -- Check business_accounts table
   \d business_accounts

   -- Verify all columns exist
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'business_accounts'
   ORDER BY ordinal_position;

   -- Check RPC functions
   SELECT proname FROM pg_proc
   WHERE proname = 'get_business_by_custom_domain';

   -- Exit
   \q
   ```

5. **Post-Migration Verification**:
   ```sql
   -- Check row counts
   SELECT 'business_accounts', COUNT(*) FROM business_accounts
   UNION ALL
   SELECT 'profiles', COUNT(*) FROM profiles
   UNION ALL
   SELECT 'wallet_transactions', COUNT(*) FROM wallet_transactions;

   -- Verify data integrity
   SELECT COUNT(*) FROM business_accounts WHERE wallet_balance < 0;
   -- Should return 0

   -- Check for orphaned records
   SELECT COUNT(*) FROM wallet_transactions wt
   LEFT JOIN business_accounts ba ON wt.business_account_id = ba.id
   WHERE ba.id IS NULL;
   -- Should return 0
   ```

**Migration Rollback** (if needed):
```bash
# Restore from backup
psql "$DATABASE_URL" < production_backup_[timestamp].sql

# Verify restoration
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM business_accounts;"
```

### Step 4: Disable Maintenance Mode

```bash
# Remove maintenance mode
rm /var/www/vehicleservice/MAINTENANCE_MODE
```

---

## Application Deployment

### Deployment Strategy: Blue-Green Deployment (Recommended)

**Blue-Green** allows zero-downtime deployment with instant rollback capability.

#### Setup

1. **Current Production** (Blue): `v0.9.9` on port 3001
2. **New Version** (Green): `v1.0.0` on port 3002

#### Deployment Steps

**Step 1: Deploy Green Environment**

```bash
# SSH into production server
ssh user@production.yourdomain.com

# Navigate to new deployment directory
cd /var/www/vehicleservice-v1.0.0

# Clone repository
git clone https://github.com/your-org/vehicleservice.git .

# Checkout production tag
git checkout tags/v1.0.0-production

# Install dependencies
npm ci --production

# Copy environment variables
cp /etc/vehicleservice-production/.env.production .env.local

# Build application
npm run build

# Verify build
ls -la .next/
```

**Step 2: Start Green Environment**

```bash
# Create PM2 config for green
cat > ecosystem.green.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vehicleservice-production-green',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/vehicleservice-v1.0.0',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/vehicleservice/green_error.log',
    out_file: '/var/log/vehicleservice/green_out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start green environment
pm2 start ecosystem.green.config.js

# Check status
pm2 status

# Verify green environment
curl http://localhost:3002/api/health
# Expected: {"status":"ok"}
```

**Step 3: Internal Testing**

```bash
# Run smoke tests against green environment
./scripts/staging-smoke-tests.sh http://localhost:3002

# Manual verification
curl http://localhost:3002/
curl http://localhost:3002/business/wallet
curl http://localhost:3002/admin
```

**Step 4: Switch Traffic (Nginx)**

```bash
# Update Nginx upstream
sudo nano /etc/nginx/sites-available/production.yourdomain.com

# Change upstream from:
upstream vehicleservice {
    server 127.0.0.1:3001;  # Blue (old)
}

# To:
upstream vehicleservice {
    server 127.0.0.1:3002 weight=100;  # Green (new)
    server 127.0.0.1:3001 weight=0 backup;  # Blue (fallback)
}

# Test Nginx configuration
sudo nginx -t

# Reload Nginx (zero downtime)
sudo systemctl reload nginx
```

**Step 5: Monitor Green Environment**

```bash
# Watch logs
pm2 logs vehicleservice-production-green --lines 100

# Watch system resources
htop

# Monitor error rate
pm2 monit
```

**Step 6: Verify Production**

```bash
# Run smoke tests against production
./scripts/staging-smoke-tests.sh https://production.yourdomain.com

# Check critical paths
curl https://production.yourdomain.com/api/health
curl -I https://production.yourdomain.com/
```

### Rollback (if needed)

```bash
# Switch traffic back to blue
sudo nano /etc/nginx/sites-available/production.yourdomain.com

upstream vehicleservice {
    server 127.0.0.1:3001 weight=100;  # Blue (old) - restored
    server 127.0.0.1:3002 weight=0;    # Green (new) - disabled
}

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Stop green environment
pm2 stop vehicleservice-production-green

# Verify blue is serving traffic
curl https://production.yourdomain.com/api/health
```

### Alternative: In-Place Deployment (Higher Risk)

**Use only if Blue-Green not possible**

```bash
# Stop application
pm2 stop vehicleservice-production

# Backup current version
mv /var/www/vehicleservice /var/www/vehicleservice-backup

# Deploy new version
cd /var/www/
git clone https://github.com/your-org/vehicleservice.git
cd vehicleservice
git checkout tags/v1.0.0-production

# Install and build
npm ci --production
npm run build

# Start application
pm2 start ecosystem.config.js

# Verify
pm2 status
curl http://localhost:3001/api/health
```

---

## Verification & Testing

### Automated Verification

```bash
# Run comprehensive smoke tests
./scripts/staging-smoke-tests.sh https://production.yourdomain.com

# Expected output:
# ✅ ALL SMOKE TESTS PASSED
```

### Manual Verification Checklist

**Critical Path Testing** (15 minutes):

- [ ] **Home Page**
  - Navigate to: `https://production.yourdomain.com`
  - Verify page loads
  - Verify no console errors

- [ ] **Authentication**
  - Test admin login
  - Test business login
  - Test logout

- [ ] **Stripe Connect OAuth**
  - Log in as business
  - Navigate to wallet
  - Click "Connect Stripe Account"
  - Complete OAuth flow
  - Verify success

- [ ] **Payment Processing**
  - Initiate wallet recharge ($10 test)
  - Complete payment with real card
  - Verify wallet balance updated
  - Verify transaction recorded

- [ ] **Webhook Processing**
  - Monitor logs for webhook event
  - Verify `payment_intent.succeeded` received
  - Verify signature verified
  - Verify wallet updated

- [ ] **Database Operations**
  - Verify read operations work
  - Verify write operations work
  - Check transaction history

- [ ] **Email Notifications**
  - Verify payment success email received
  - Verify OAuth connection email received

### Performance Verification

```bash
# Test response times
time curl https://production.yourdomain.com/api/health

# Expected: < 1 second

# Test page load time
curl -w "@curl-format.txt" -o /dev/null -s https://production.yourdomain.com/

# curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n
```

---

## Gradual Rollout Strategy

### Phase 1: Internal Testing (0-2 hours)

**Traffic**: Internal team only

- [ ] Deploy to production
- [ ] Verify all systems operational
- [ ] Test critical paths
- [ ] Monitor for errors

**Go/No-Go Decision**: Proceed if no critical issues

### Phase 2: Canary Release (2-6 hours)

**Traffic**: 5% of users

```nginx
# Nginx configuration for canary
upstream vehicleservice {
    server 127.0.0.1:3002 weight=5;   # New version (5%)
    server 127.0.0.1:3001 weight=95;  # Old version (95%)
}
```

**Monitoring**:
- [ ] Error rate < 1%
- [ ] Response time < 2 seconds
- [ ] No payment failures
- [ ] No database errors

**Duration**: Minimum 2 hours

**Go/No-Go Decision**: Proceed if metrics acceptable

### Phase 3: Gradual Increase (6-24 hours)

**Traffic Progression**:
- Hour 6: 25% new version
- Hour 12: 50% new version
- Hour 18: 75% new version
- Hour 24: 100% new version

**Update Nginx weights** at each phase:
```bash
sudo nano /etc/nginx/sites-available/production.yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

### Phase 4: Full Rollout (24+ hours)

**Traffic**: 100% on new version

```nginx
upstream vehicleservice {
    server 127.0.0.1:3002 weight=100;  # New version
    server 127.0.0.1:3001 weight=0 backup;  # Old version (backup)
}
```

**Post-Rollout**:
- [ ] Monitor for 24 hours
- [ ] Review metrics
- [ ] Address any issues
- [ ] Document lessons learned

---

## Monitoring & Alerting

### Real-Time Monitoring

**Application Metrics**:
```bash
# Watch logs
pm2 logs vehicleservice-production --lines 100

# Monitor processes
pm2 monit

# System resources
htop
```

**Database Monitoring**:
```sql
-- Active connections
SELECT COUNT(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Database size
SELECT pg_size_pretty(pg_database_size('postgres'));
```

### Alert Configuration

**Critical Alerts** (Page immediately):
- Application down
- Database unreachable
- Error rate > 5%
- Response time > 5 seconds
- Payment processing failures

**Warning Alerts** (Email/Slack):
- Error rate > 1%
- Response time > 2 seconds
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%

### Metrics to Monitor

**Application**:
- Requests per minute
- Error rate
- Response time (P50, P95, P99)
- Active users

**Business**:
- Payments processed
- Successful OAuth connections
- Auto-recharge triggers
- Webhook events

**Infrastructure**:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

---

## Rollback Procedures

### When to Rollback

**Immediate rollback if**:
- Critical functionality broken
- Data corruption detected
- Security vulnerability exposed
- Error rate > 10%
- Multiple payment failures

**Consider rollback if**:
- Error rate > 5% for 30+ minutes
- Response time degraded significantly
- User complaints exceed threshold

### Rollback Steps

#### Blue-Green Rollback (Instant)

```bash
# Switch Nginx to old version
sudo nano /etc/nginx/sites-available/production.yourdomain.com

upstream vehicleservice {
    server 127.0.0.1:3001 weight=100;  # Old version
    server 127.0.0.1:3002 weight=0;    # New version (disabled)
}

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Verify
curl https://production.yourdomain.com/api/health

# Stop new version
pm2 stop vehicleservice-production-green
```

**Duration**: < 2 minutes

#### Database Rollback (If Required)

```bash
# Stop application
pm2 stop all

# Restore database from backup
psql "$DATABASE_URL" < production_backup_[timestamp].sql

# Verify restoration
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM business_accounts;"

# Restart application
pm2 restart all
```

**Duration**: 5-15 minutes (depending on database size)

### Post-Rollback

- [ ] Verify old version operational
- [ ] Communicate rollback to stakeholders
- [ ] Investigate root cause
- [ ] Document incident
- [ ] Plan remediation

---

## Post-Deployment

### First 24 Hours

**Hour 1-2**: Intensive monitoring
- [ ] Watch logs continuously
- [ ] Monitor error rates
- [ ] Check payment success rate
- [ ] Verify webhook processing

**Hour 2-6**: Active monitoring
- [ ] Check metrics every 30 minutes
- [ ] Respond to alerts
- [ ] Address minor issues

**Hour 6-24**: Standard monitoring
- [ ] Check metrics every 2 hours
- [ ] Review daily metrics
- [ ] Monitor user feedback

### Week 1

- [ ] Daily metrics review
- [ ] Address any issues
- [ ] Collect user feedback
- [ ] Monitor performance trends
- [ ] Optimize if needed

### Post-Deployment Review

**Schedule**: 1 week after deployment

**Attendees**:
- Deployment team
- QA team
- Product team
- DevOps

**Agenda**:
- Review deployment process
- Discuss issues encountered
- Identify improvements
- Update documentation
- Plan future deployments

---

## Incident Response

### Severity Levels

**SEV 1 (Critical)**:
- Application completely down
- Data loss or corruption
- Security breach
- Payment processing completely failed

**Response**: Immediate, all hands on deck, rollback if needed

**SEV 2 (High)**:
- Major functionality impaired
- Significant performance degradation
- Intermittent payment failures

**Response**: Within 1 hour, escalate if not resolved

**SEV 3 (Medium)**:
- Minor functionality impaired
- Performance degraded
- Non-critical errors

**Response**: Within 4 hours, fix in next deployment

**SEV 4 (Low)**:
- Cosmetic issues
- Minor bugs
- Feature requests

**Response**: Planned maintenance

### Incident Response Steps

1. **Identify**: Alert received or issue reported
2. **Assess**: Determine severity
3. **Communicate**: Notify stakeholders
4. **Mitigate**: Rollback or hotfix
5. **Resolve**: Fix root cause
6. **Review**: Post-incident review

### Communication Template

```
INCIDENT ALERT - [SEVERITY]

Issue: [Description]
Impact: [User impact]
Status: [Investigating / Mitigating / Resolved]
ETA: [Estimated resolution time]
Next Update: [Timestamp]

Actions Taken:
- [Action 1]
- [Action 2]

Team: [Names of people working on incident]
```

---

## Success Criteria

**Deployment is considered successful if**:

- [ ] All smoke tests passing
- [ ] No critical errors in logs
- [ ] Error rate < 1%
- [ ] Response time < 2 seconds
- [ ] All critical features working
- [ ] Payments processing successfully
- [ ] Webhooks processing correctly
- [ ] No data loss or corruption
- [ ] Stable for 24+ hours

---

## Emergency Contacts

**Primary Contacts**:
- Deployment Lead: _________________________
- DevOps Lead: _________________________
- Database Admin: _________________________

**Escalation**:
- CTO: _________________________
- CEO: _________________________

**External**:
- Stripe Support: https://support.stripe.com
- Supabase Support: https://supabase.com/support
- Hosting Provider: _________________________

---

## Appendix: Production Checklist Summary

**Pre-Deployment** (T-72 to T-0):
- [ ] All prerequisites met
- [ ] Team assembled
- [ ] Communication plan active

**Deployment** (T-0 to T+4 hours):
- [ ] Database backup created
- [ ] Migrations executed successfully
- [ ] Application deployed
- [ ] Smoke tests passed
- [ ] Initial monitoring shows healthy metrics

**Post-Deployment** (T+4 hours to T+7 days):
- [ ] 24-hour intensive monitoring completed
- [ ] Week 1 monitoring ongoing
- [ ] Post-deployment review scheduled
- [ ] Documentation updated

---

**Document Version**: 1.0.0
**Last Updated**: November 7, 2025
**Classification**: CONFIDENTIAL - Production Deployment
**Related Documents**:
- `/docs/STAGING_DEPLOYMENT_GUIDE.md`
- `/docs/DEPLOYMENT_VERIFICATION_CHECKLIST.md`
- `/scripts/staging-smoke-tests.sh`
- `/docs/BATCH_4_REGRESSION_TESTING_CHECKLIST.md`

---

**DEPLOYMENT APPROVAL REQUIRED**

**Approved by**:

Product Manager: _________________________ Date: _________

Engineering Lead: _________________________ Date: _________

DevOps Lead: _________________________ Date: _________

CTO: _________________________ Date: _________
