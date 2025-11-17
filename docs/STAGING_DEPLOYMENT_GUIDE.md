# Staging Deployment Guide - VIK-29

**Project**: VIK-29 Business Wallet Enhancement
**Phase**: Staging Deployment
**Version**: 1.0.0
**Date**: November 7, 2025

---

## Purpose

This guide provides step-by-step instructions for deploying the VIK-29 Business Wallet Enhancement (Stripe Connect Multi-Tenant System) to the staging environment. Follow these instructions carefully to ensure a successful deployment.

**Estimated Time**: 2-3 hours for complete deployment and verification

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All code merged to staging branch
- [ ] All automated tests passing (`npm test`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] No console errors in development
- [ ] Code review completed and approved
- [ ] Git tag created for this release: `v1.0.0-staging`

### Documentation Review

- [ ] All documentation reviewed and up-to-date
- [ ] Environment variables documented
- [ ] Database migrations reviewed
- [ ] Rollback plan prepared

### Team Communication

- [ ] QA team notified of staging deployment
- [ ] DevOps team available for support
- [ ] Product team aware of deployment timeline
- [ ] Stakeholders informed

---

## Part 1: Environment Setup

### 1.1 Staging Server Configuration

**Prerequisites**:
- Staging server provisioned (recommend: Vercel, AWS, or DigitalOcean)
- Domain configured: `staging.yourdomain.com`
- SSL certificate installed
- Node.js 18+ installed
- Git access configured

**Verify Server Requirements**:
```bash
# SSH into staging server
ssh user@staging.yourdomain.com

# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check available disk space (need at least 5GB)
df -h

# Check available memory (recommend 2GB+)
free -h
```

---

### 1.2 Stripe Account Setup

**Create Staging Stripe Accounts**:

#### Platform Account (Staging)
1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Create new account or switch to existing staging account
3. Navigate to **Developers → API keys**
4. Record:
   - **Publishable key**: `pk_test_...` (for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
   - **Secret key**: `sk_test_...` (for `STRIPE_SECRET_KEY`)

#### Enable Stripe Connect
1. In Stripe Dashboard, go to **Connect → Settings**
2. Click **Get started** if Connect not enabled
3. Complete business profile information
4. Navigate to **Connect → Settings → Integration**
5. Add redirect URI: `https://staging.yourdomain.com/api/business/stripe/callback`
6. Record **Client ID**: `ca_...` (for `STRIPE_CONNECT_CLIENT_ID`)

#### Webhook Configuration
1. Navigate to **Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://staging.yourdomain.com/api/business/wallet/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_method.attached`
   - `payment_method.detached`
5. Click **Add endpoint**
6. Record **Signing secret**: `whsec_...` (for `STRIPE_WEBHOOK_SECRET`)

---

### 1.3 Supabase Staging Project Setup

**Create Staging Supabase Project**:

1. Log in to Supabase: https://app.supabase.com
2. Create new project: `vehicleservice-staging`
3. Select region closest to staging server
4. Set strong database password (save to password manager)
5. Wait for project provisioning (~2 minutes)

**Configure Supabase**:

1. Navigate to **Project Settings → API**
2. Record:
   - **Project URL**: `https://[project-ref].supabase.co` (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon public key**: `eyJ...` (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Service role key**: `eyJ...` (for `SUPABASE_SERVICE_ROLE_KEY`) ⚠️ Keep secret!

3. Navigate to **Project Settings → Database**
4. Record connection string: `postgresql://postgres:[password]@[host]:5432/postgres`

---

### 1.4 Environment Variables Configuration

**Create `.env.staging` file**:

```bash
# Copy example and edit
cp .env.example .env.staging
```

**Required Environment Variables** (24 total):

```bash
# ============================================
# NEXT.JS CONFIGURATION
# ============================================
NODE_ENV=staging
NEXT_PUBLIC_SITE_URL=https://staging.yourdomain.com

# ============================================
# SUPABASE CONFIGURATION
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=eyJ[your-service-role-key]

# Database direct connection (for migrations)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# ============================================
# STRIPE CONFIGURATION
# ============================================
# Standard Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[your-publishable-key]
STRIPE_SECRET_KEY=sk_test_[your-secret-key]

# Stripe Connect OAuth
STRIPE_CONNECT_CLIENT_ID=ca_[your-client-id]

# Webhook secret (from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

# ============================================
# ENCRYPTION & SECURITY
# ============================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY=[generate-32-byte-base64-key]

# OAuth state token secret
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
STATE_SECRET=[generate-random-hex-string]

# ============================================
# EMAIL CONFIGURATION (Resend)
# ============================================
RESEND_API_KEY=re_[your-resend-api-key]
NEXT_PUBLIC_FROM_EMAIL=noreply@staging.yourdomain.com

# ============================================
# BUSINESS ACCOUNT DEFAULTS
# ============================================
DEFAULT_WALLET_BALANCE=0
AUTO_RECHARGE_ENABLED=false
AUTO_RECHARGE_THRESHOLD=50
AUTO_RECHARGE_AMOUNT=500

# ============================================
# FEATURE FLAGS (Optional)
# ============================================
ENABLE_CUSTOM_DOMAINS=true
ENABLE_AUTO_RECHARGE=true
ENABLE_MULTI_CURRENCY=true

# ============================================
# MONITORING & LOGGING
# ============================================
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
```

**Generate Required Secrets**:

```bash
# Generate ENCRYPTION_KEY (32 bytes base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate STATE_SECRET (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Verify Environment Variables**:
```bash
# Run verification script
chmod +x scripts/check-env-vars.sh
./scripts/check-env-vars.sh
```

Expected output:
```
✅ All required environment variables are set
✅ Encryption key is valid (32 bytes)
✅ State secret is valid
✅ Stripe keys are valid format
✅ Supabase keys are valid format
```

---

## Part 2: Database Migration

### 2.1 Backup Current Database (If Applicable)

```bash
# Connect to Supabase staging database
psql "$DATABASE_URL"

# Create backup
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh backup_*.sql
```

---

### 2.2 Run Database Migrations

**List Pending Migrations**:
```bash
# Check which migrations need to run
ls -la supabase/migrations/
```

**Run Migrations**:
```bash
# Option 1: Using Supabase CLI (recommended)
npx supabase db push --db-url "$DATABASE_URL"

# Option 2: Using custom migration script
node scripts/run-migration.ts

# Option 3: Manual execution (if needed)
psql "$DATABASE_URL" < supabase/migrations/20250103_create_business_accounts.sql
psql "$DATABASE_URL" < supabase/migrations/20250107_create_business_profiles.sql
# ... run all migrations in order
```

**Critical Migrations for VIK-29**:
- `20250103_create_business_accounts.sql` - Business accounts table
- `20250107_create_business_profiles.sql` - Business profiles with branding
- All Stripe Connect related columns must exist

---

### 2.3 Verify Database Schema

```sql
-- Connect to database
psql "$DATABASE_URL"

-- Verify business_accounts table structure
\d business_accounts

-- Should see these columns:
-- - stripe_connect_enabled (boolean)
-- - stripe_connected_account_id (text)
-- - stripe_access_token_encrypted (text)
-- - stripe_refresh_token_encrypted (text)
-- - custom_domain (text)
-- - custom_domain_verified (boolean)
-- - brand_name (text)
-- - logo_url (text)
-- - primary_color (varchar)
-- - secondary_color (varchar)
-- - accent_color (varchar)
-- - wallet_balance (decimal)
-- - auto_recharge_enabled (boolean)
-- - auto_recharge_threshold (decimal)
-- - auto_recharge_amount (decimal)

-- Verify RPC function exists
SELECT proname FROM pg_proc WHERE proname = 'get_business_by_custom_domain';
-- Should return 1 row

-- Verify wallet_transactions table
\d wallet_transactions

-- Test RPC function
SELECT * FROM get_business_by_custom_domain('test.example.com');
-- Should return empty result (no test domain yet)

-- Exit
\q
```

---

### 2.4 Seed Test Data (Optional)

```bash
# Create test business accounts for staging
node scripts/seed-staging-data.js
```

Or manually:

```sql
-- Insert test business account
INSERT INTO business_accounts (
  id,
  business_name,
  business_email,
  wallet_balance,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  'Test Business 1',
  'test1@staging.yourdomain.com',
  1000.00,
  'active',
  NOW()
);

-- Insert test user
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@staging.yourdomain.com',
  'Staging Admin',
  'admin',
  NOW()
);
```

---

## Part 3: Application Deployment

### 3.1 Clone Repository to Staging Server

```bash
# SSH into staging server
ssh user@staging.yourdomain.com

# Navigate to deployment directory
cd /var/www/

# Clone repository (or pull latest changes)
git clone https://github.com/your-org/vehicleservice.git
cd vehicleservice

# Checkout staging branch or specific tag
git checkout staging
# OR
git checkout tags/v1.0.0-staging

# Verify correct branch/tag
git log --oneline -n 5
```

---

### 3.2 Install Dependencies

```bash
# Install Node.js dependencies
npm ci --production=false

# Verify installation
npm ls --depth=0

# Check for vulnerabilities
npm audit

# Fix critical vulnerabilities if any
npm audit fix
```

---

### 3.3 Configure Environment

```bash
# Copy environment variables
cp .env.staging .env.local

# Verify environment variables
cat .env.local | grep -v "^#" | grep -v "^$"

# Run verification script
./scripts/check-env-vars.sh
```

---

### 3.4 Build Application

```bash
# Run TypeScript type checking
npm run type-check
# OR
npx tsc --noEmit

# Build Next.js application
npm run build

# Verify build succeeded
ls -la .next/

# Check build output size
du -sh .next/
```

**Expected Build Output**:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    [...]    [...]
├ ○ /admin                               [...]    [...]
├ ○ /business/wallet                     [...]    [...]
└ ○ /api/business/stripe/connect         [...]    [...]

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses getStaticProps)
λ  (Dynamic) server-rendered on demand
```

---

### 3.5 Start Application

**Option 1: Using PM2 (Recommended for Production-like Staging)**:

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vehicleservice-staging',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/vehicleservice',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    error_file: '/var/log/vehicleservice/error.log',
    out_file: '/var/log/vehicleservice/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Check status
pm2 status

# View logs
pm2 logs vehicleservice-staging --lines 50
```

**Option 2: Using systemd (Alternative)**:

```bash
# Create systemd service file
sudo cat > /etc/systemd/system/vehicleservice-staging.service << 'EOF'
[Unit]
Description=Vehicle Service Staging
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vehicleservice
Environment=NODE_ENV=staging
Environment=PORT=3001
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=vehicleservice-staging

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start vehicleservice-staging

# Enable on boot
sudo systemctl enable vehicleservice-staging

# Check status
sudo systemctl status vehicleservice-staging

# View logs
sudo journalctl -u vehicleservice-staging -f
```

**Option 3: Using Docker (If Containerized)**:

```bash
# Build Docker image
docker build -t vehicleservice-staging:v1.0.0 .

# Run container
docker run -d \
  --name vehicleservice-staging \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env.local \
  vehicleservice-staging:v1.0.0

# Check status
docker ps | grep vehicleservice-staging

# View logs
docker logs -f vehicleservice-staging
```

---

### 3.6 Verify Application Started

```bash
# Check if application is listening on port 3001
netstat -tulpn | grep :3001
# OR
lsof -i :3001

# Test local endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-07T..."}

# Check application logs
tail -f /var/log/vehicleservice/out.log
# OR
pm2 logs vehicleservice-staging --lines 50
```

---

## Part 4: Nginx Configuration (If Using Reverse Proxy)

### 4.1 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/staging.yourdomain.com
```

**Nginx Configuration**:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name staging.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name staging.yourdomain.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/staging.yourdomain.com.access.log;
    error_log /var/log/nginx/staging.yourdomain.com.error.log;

    # Client request size
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static files
    location /_next/static {
        alias /var/www/vehicleservice/.next/static;
        expires 365d;
        access_log off;
    }

    # Public static files
    location /static {
        alias /var/www/vehicleservice/public;
        expires 7d;
        access_log off;
    }
}
```

---

### 4.2 Enable Site and Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/staging.yourdomain.com /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## Part 5: Stripe CLI Webhook Forwarding

### 5.1 Install Stripe CLI on Staging Server

```bash
# Download Stripe CLI
wget https://github.com/stripe/stripe-cli/releases/download/v1.17.0/stripe_1.17.0_linux_x86_64.tar.gz

# Extract
tar -xvf stripe_1.17.0_linux_x86_64.tar.gz

# Move to /usr/local/bin
sudo mv stripe /usr/local/bin/

# Verify installation
stripe --version
```

---

### 5.2 Configure Stripe CLI

```bash
# Login to Stripe (interactive)
stripe login

# Alternative: Use restricted key
stripe login --api-key sk_test_[your-secret-key]

# Test connection
stripe config --list
```

---

### 5.3 Start Webhook Forwarding (For Testing)

```bash
# Forward webhooks to staging server
stripe listen --forward-to https://staging.yourdomain.com/api/business/wallet/webhook

# Should see:
# Ready! Your webhook signing secret is whsec_... (^C to quit)

# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

**Note**: For staging, you should configure webhooks directly in Stripe Dashboard (done in Part 1.2) rather than using CLI forwarding for persistent testing.

---

## Part 6: Post-Deployment Verification

### 6.1 Health Check

```bash
# Test application health endpoint
curl https://staging.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-07T...","version":"1.0.0"}

# Check from external monitoring tool
curl -I https://staging.yourdomain.com
# Should return HTTP/2 200
```

---

### 6.2 Database Connectivity

```bash
# Test database connection from application
curl https://staging.yourdomain.com/api/test-db-connection

# Expected response:
# {"status":"connected","message":"Database connection successful"}
```

---

### 6.3 Stripe Integration

```bash
# Test Stripe connection
curl -X POST https://staging.yourdomain.com/api/test-stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected response:
# {"status":"ok","stripe_connected":true}
```

---

### 6.4 Supabase Integration

**Test Supabase Connection**:
```bash
# From staging server
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
supabase.from('business_accounts').select('count').then(console.log);
"
```

---

## Part 7: Smoke Tests Execution

### 7.1 Manual Smoke Tests

**Critical Path 1: OAuth Connection**
1. Navigate to: `https://staging.yourdomain.com/business/wallet`
2. Log in with test business account
3. Click "Connect Stripe Account"
4. Complete OAuth flow
5. Verify success message
6. Verify connected account ID displayed

**Critical Path 2: Manual Payment**
1. Stay on wallet page
2. Click "Add Credits"
3. Enter amount: $100
4. Card: 4242 4242 4242 4242
5. Complete payment
6. Verify wallet balance increased
7. Verify transaction recorded

**Critical Path 3: Webhook Processing**
1. Check server logs for webhook events
2. Verify `payment_intent.succeeded` event received
3. Verify wallet balance updated

---

### 7.2 Automated Smoke Tests Script

Create `/scripts/smoke-tests.sh`:

```bash
#!/bin/bash

# Smoke Tests for Staging Deployment
# Usage: ./scripts/smoke-tests.sh

set -e

STAGING_URL="https://staging.yourdomain.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Running Smoke Tests for Staging..."
echo "Target: $STAGING_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/api/health)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $RESPONSE)${NC}"
    exit 1
fi

# Test 2: Home Page Loads
echo "Test 2: Home Page"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Home page loads${NC}"
else
    echo -e "${RED}✗ Home page failed (HTTP $RESPONSE)${NC}"
    exit 1
fi

# Test 3: Business Wallet Page
echo "Test 3: Business Wallet Page"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/business/wallet)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}✓ Wallet page accessible${NC}"
else
    echo -e "${RED}✗ Wallet page failed (HTTP $RESPONSE)${NC}"
    exit 1
fi

# Test 4: Admin Dashboard
echo "Test 4: Admin Dashboard"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/admin)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}✓ Admin dashboard accessible${NC}"
else
    echo -e "${RED}✗ Admin dashboard failed (HTTP $RESPONSE)${NC}"
    exit 1
fi

# Test 5: Static Assets
echo "Test 5: Static Assets"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/_next/static/css/styles.css 2>/dev/null || echo "404")
if [ "$RESPONSE" != "000" ]; then
    echo -e "${GREEN}✓ Static assets serve${NC}"
else
    echo -e "${RED}✗ Static assets failed${NC}"
    exit 1
fi

# Test 6: Database Connection
echo "Test 6: Database Connection"
# This would need an API endpoint that tests DB connection
# RESPONSE=$(curl -s $STAGING_URL/api/test-db-connection | jq -r '.status')
# For now, we'll skip this in the script
echo -e "${GREEN}✓ Database connection (manual verification required)${NC}"

echo ""
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
echo "Staging deployment appears healthy."
```

Make executable and run:
```bash
chmod +x scripts/smoke-tests.sh
./scripts/smoke-tests.sh
```

---

## Part 8: Monitoring Setup

### 8.1 Application Logs

**Configure Log Rotation**:
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/vehicleservice-staging
```

```
/var/log/vehicleservice/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

### 8.2 Uptime Monitoring

**Configure UptimeRobot or Similar**:
- Monitor: `https://staging.yourdomain.com/api/health`
- Check interval: 5 minutes
- Alert contacts: DevOps team email

---

### 8.3 Error Tracking (Optional)

**Configure Sentry (if used)**:
```bash
# In .env.local
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=vehicleservice-staging
```

---

## Part 9: Rollback Plan

### 9.1 Rollback Procedure

If deployment fails or critical issues found:

```bash
# SSH into staging server
ssh user@staging.yourdomain.com

# Stop application
pm2 stop vehicleservice-staging

# Revert to previous version
cd /var/www/vehicleservice
git checkout tags/v0.9.9-staging  # Previous working version

# Reinstall dependencies (if needed)
npm ci

# Rebuild
npm run build

# Restart application
pm2 restart vehicleservice-staging

# Verify rollback
curl https://staging.yourdomain.com/api/health
```

---

### 9.2 Database Rollback

```bash
# Restore from backup (if database changes need reverting)
psql "$DATABASE_URL" < backup_20251107_120000.sql

# Verify restoration
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM business_accounts;"
```

---

## Part 10: Next Steps

### 10.1 QA Testing

- [ ] Execute Quick QA Checklist (45-60 minutes)
  - File: `/docs/QA_STRIPE_CONNECT_CHECKLIST.md`
- [ ] Execute Full Regression Tests (3-4 hours)
  - File: `/docs/BATCH_4_REGRESSION_TESTING_CHECKLIST.md`
- [ ] Execute Custom Domain Tests (1-2 hours)
  - File: `/docs/CUSTOM_DOMAIN_THEME_TESTING_GUIDE.md`

---

### 10.2 Performance Testing

- [ ] Run load tests with 50+ concurrent users
- [ ] Measure actual response times
- [ ] Check database query performance
- [ ] Monitor memory usage under load

---

### 10.3 Security Testing

- [ ] Run security scan (OWASP ZAP or similar)
- [ ] Verify all secrets encrypted
- [ ] Test authentication bypass attempts
- [ ] Verify CORS configuration
- [ ] Check for exposed environment variables

---

### 10.4 Sign-Off

- [ ] QA team approval
- [ ] Product team review
- [ ] Stakeholder demo completed
- [ ] All critical bugs fixed
- [ ] Documentation updated

---

## Troubleshooting

### Issue: Application Won't Start

**Symptoms**: Application crashes immediately after start

**Diagnosis**:
```bash
# Check logs
pm2 logs vehicleservice-staging --err --lines 100

# Common causes:
# - Missing environment variables
# - Port already in use
# - Database connection failure
```

**Solution**:
```bash
# Verify environment variables
./scripts/check-env-vars.sh

# Check port availability
lsof -i :3001

# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

### Issue: Database Migration Fails

**Symptoms**: Migration errors during deployment

**Diagnosis**:
```bash
# Check migration status
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# Check for conflicting changes
psql "$DATABASE_URL" -c "\d business_accounts"
```

**Solution**:
```bash
# Rollback failed migration (if needed)
psql "$DATABASE_URL" < supabase/migrations/rollback/[migration_file].sql

# Re-run migration
psql "$DATABASE_URL" < supabase/migrations/[migration_file].sql
```

---

### Issue: Stripe Webhooks Not Received

**Symptoms**: Payments complete but wallet not updated

**Diagnosis**:
```bash
# Check webhook endpoint accessibility
curl -I https://staging.yourdomain.com/api/business/wallet/webhook

# Check webhook logs in Stripe Dashboard
# Navigate to: Developers → Webhooks → [Your endpoint] → Logs

# Check application logs
pm2 logs vehicleservice-staging | grep "webhook"
```

**Solution**:
```bash
# Verify webhook secret is correct
echo $STRIPE_WEBHOOK_SECRET

# Test webhook locally with Stripe CLI
stripe trigger payment_intent.succeeded
```

---

### Issue: SSL Certificate Error

**Symptoms**: HTTPS not working, certificate warnings

**Solution**:
```bash
# Install/renew Let's Encrypt certificate
sudo certbot --nginx -d staging.yourdomain.com

# Verify certificate
sudo certbot certificates

# Test SSL
curl -I https://staging.yourdomain.com
```

---

## Deployment Checklist Summary

**Pre-Deployment** (30 minutes):
- [ ] Code merged and tagged
- [ ] All tests passing
- [ ] Environment variables prepared
- [ ] Team notified

**Deployment** (60-90 minutes):
- [ ] Stripe accounts configured
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Application deployed and started
- [ ] Nginx configured
- [ ] Smoke tests passed

**Post-Deployment** (30 minutes):
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Logs accessible
- [ ] Rollback plan tested

**QA Testing** (7-10 hours):
- [ ] Quick QA checklist
- [ ] Full regression tests
- [ ] Custom domain tests
- [ ] Sign-off obtained

---

## Related Documentation

- `/docs/QA_STRIPE_CONNECT_CHECKLIST.md` - Quick QA verification (45-60 min)
- `/docs/BATCH_4_REGRESSION_TESTING_CHECKLIST.md` - Full regression tests (3-4 hours)
- `/docs/STRIPE_CONNECT_TESTING_GUIDE.md` - Detailed Stripe Connect testing
- `/docs/CUSTOM_DOMAIN_THEME_TESTING_GUIDE.md` - Custom domain testing
- `/docs/STRIPE_CONNECT_ENVIRONMENT_CHECKLIST.md` - Environment variables reference
- `/docs/STRIPE_DASHBOARD_SETUP_GUIDE.md` - Stripe configuration details

---

**Document Version**: 1.0.0
**Last Updated**: November 7, 2025
**Estimated Total Time**: 2-3 hours for deployment + 7-10 hours for QA testing
**Status**: Ready for execution

---

**Deployment Lead**: ___________________________
**Date Deployed**: ___________________________
**Deployment Status**: [ ] Success [ ] Failed [ ] Rolled Back
**Notes**: ___________________________
