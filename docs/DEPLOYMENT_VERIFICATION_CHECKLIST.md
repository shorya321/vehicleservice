# Deployment Verification Checklist

**Project**: VIK-29 Business Wallet Enhancement
**Environment**: Staging / Production
**Version**: 1.0.0
**Date**: November 7, 2025

---

## Purpose

This checklist ensures that all aspects of the deployment are verified and functioning correctly before marking the deployment as complete. Use this checklist for both staging and production deployments.

**Instructions**: Check each item as you verify it. All items marked 🔴 are critical and must pass before proceeding.

---

## Section 1: Pre-Deployment Verification 🔴

**Status**: [ ] Complete

### Code & Build

- [ ] **1.1** Code merged to deployment branch (staging/main)
- [ ] **1.2** Git tag created: `v1.0.0-[environment]`
- [ ] **1.3** All automated tests passing locally
  ```bash
  npm test
  # Expected: All tests pass
  ```
- [ ] **1.4** Build succeeds without errors
  ```bash
  npm run build
  # Expected: Build completes successfully
  ```
- [ ] **1.5** TypeScript compilation succeeds
  ```bash
  npx tsc --noEmit
  # Expected: No TypeScript errors
  ```
- [ ] **1.6** ESLint passes without errors
  ```bash
  npm run lint
  # Expected: No linting errors
  ```

### Documentation

- [ ] **1.7** All documentation up-to-date
- [ ] **1.8** Changelog updated with release notes
- [ ] **1.9** Environment variables documented
- [ ] **1.10** Database migration plan reviewed
- [ ] **1.11** Rollback plan documented

### Team Coordination

- [ ] **1.12** Deployment scheduled and communicated
- [ ] **1.13** QA team notified
- [ ] **1.14** DevOps team available for support
- [ ] **1.15** Stakeholders informed of deployment window

**Sign-off**: _________________________ Date: _________

---

## Section 2: Environment Configuration 🔴

**Status**: [ ] Complete

### Server Infrastructure

- [ ] **2.1** Server provisioned and accessible
- [ ] **2.2** Domain configured correctly
- [ ] **2.3** SSL certificate installed and valid
  ```bash
  curl -I https://[domain]
  # Expected: HTTP/2 200, valid SSL
  ```
- [ ] **2.4** Firewall rules configured
- [ ] **2.5** Load balancer configured (if applicable)

### Environment Variables

- [ ] **2.6** All required environment variables set (24 variables)
- [ ] **2.7** Environment verification script passes
  ```bash
  ./scripts/check-env-vars.sh
  # Expected: ✅ All required environment variables are set
  ```
- [ ] **2.8** Secrets properly encrypted and secured
- [ ] **2.9** No sensitive data in version control
- [ ] **2.10** Environment-specific values correct (URLs, keys, etc.)

**Verification Command**:
```bash
# Check critical env vars are set
echo "NODE_ENV: $NODE_ENV"
echo "NEXT_PUBLIC_SITE_URL: $NEXT_PUBLIC_SITE_URL"
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "STRIPE_CONNECT_CLIENT_ID: ${STRIPE_CONNECT_CLIENT_ID:0:10}..."
```

### External Services

- [ ] **2.11** Supabase project created and configured
- [ ] **2.12** Stripe account configured (platform + Connect)
- [ ] **2.13** Stripe webhooks configured correctly
- [ ] **2.14** Resend API configured for emails
- [ ] **2.15** DNS records configured (if custom domain)

**Sign-off**: _________________________ Date: _________

---

## Section 3: Database Migration 🔴

**Status**: [ ] Complete

### Backup

- [ ] **3.1** Database backup created before migration
  ```bash
  pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] **3.2** Backup file size verified (> 0 bytes)
- [ ] **3.3** Backup stored in secure location

### Migration Execution

- [ ] **3.4** Migration plan reviewed
- [ ] **3.5** All pending migrations identified
- [ ] **3.6** Migrations executed successfully
  ```bash
  npx supabase db push --db-url "$DATABASE_URL"
  # OR
  node scripts/run-migration.ts
  ```
- [ ] **3.7** No migration errors in logs
- [ ] **3.8** Migration completion confirmed

### Schema Verification

- [ ] **3.9** business_accounts table structure verified
  ```sql
  \d business_accounts
  ```
- [ ] **3.10** All Stripe Connect columns present:
  - [ ] stripe_connect_enabled
  - [ ] stripe_connected_account_id
  - [ ] stripe_access_token_encrypted
  - [ ] stripe_refresh_token_encrypted
- [ ] **3.11** All custom domain columns present:
  - [ ] custom_domain
  - [ ] custom_domain_verified
  - [ ] brand_name
  - [ ] logo_url
  - [ ] primary_color
  - [ ] secondary_color
  - [ ] accent_color
- [ ] **3.12** All wallet columns present:
  - [ ] wallet_balance
  - [ ] auto_recharge_enabled
  - [ ] auto_recharge_threshold
  - [ ] auto_recharge_amount
- [ ] **3.13** RPC functions verified:
  ```sql
  SELECT proname FROM pg_proc WHERE proname = 'get_business_by_custom_domain';
  # Expected: 1 row returned
  ```
- [ ] **3.14** Wallet transactions table exists and accessible

### Data Integrity

- [ ] **3.15** Row counts match expectations
  ```sql
  SELECT COUNT(*) FROM business_accounts;
  SELECT COUNT(*) FROM profiles;
  SELECT COUNT(*) FROM wallet_transactions;
  ```
- [ ] **3.16** No orphaned foreign key references
- [ ] **3.17** Indexes created successfully
- [ ] **3.18** RLS policies applied

**Sign-off**: _________________________ Date: _________

---

## Section 4: Application Deployment 🔴

**Status**: [ ] Complete

### Code Deployment

- [ ] **4.1** Repository cloned/updated on server
- [ ] **4.2** Correct branch/tag checked out
- [ ] **4.3** Dependencies installed
  ```bash
  npm ci
  ```
- [ ] **4.4** Build completed successfully
  ```bash
  npm run build
  ```
- [ ] **4.5** No build warnings or errors

### Application Start

- [ ] **4.6** Application started successfully
  ```bash
  pm2 start ecosystem.config.js
  # OR
  sudo systemctl start vehicleservice-[environment]
  ```
- [ ] **4.7** Application running and stable
  ```bash
  pm2 status
  # OR
  sudo systemctl status vehicleservice-[environment]
  ```
- [ ] **4.8** No errors in application logs
  ```bash
  pm2 logs --lines 50
  # OR
  sudo journalctl -u vehicleservice-[environment] -n 50
  ```
- [ ] **4.9** Application listening on correct port
  ```bash
  lsof -i :3001
  ```

### Process Management

- [ ] **4.10** Process manager configured (PM2/systemd)
- [ ] **4.11** Auto-restart enabled
- [ ] **4.12** Application set to start on system boot
- [ ] **4.13** Log rotation configured
- [ ] **4.14** Resource limits configured (memory, CPU)

**Sign-off**: _________________________ Date: _________

---

## Section 5: Web Server Configuration 🟡

**Status**: [ ] Complete

### Nginx/Reverse Proxy

- [ ] **5.1** Nginx configuration created
- [ ] **5.2** Server blocks configured correctly
- [ ] **5.3** SSL certificates configured
- [ ] **5.4** HTTP to HTTPS redirect working
- [ ] **5.5** Proxy pass configured to application port
- [ ] **5.6** Security headers configured:
  - [ ] Strict-Transport-Security
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
- [ ] **5.7** Client body size limit set (10MB)
- [ ] **5.8** Timeouts configured appropriately

### Testing

- [ ] **5.9** Nginx configuration test passes
  ```bash
  sudo nginx -t
  # Expected: syntax is ok, test is successful
  ```
- [ ] **5.10** Nginx reloaded successfully
  ```bash
  sudo systemctl reload nginx
  ```
- [ ] **5.11** No errors in Nginx logs
  ```bash
  sudo tail -n 50 /var/log/nginx/error.log
  ```

**Sign-off**: _________________________ Date: _________

---

## Section 6: Smoke Tests 🔴

**Status**: [ ] Complete

### Automated Smoke Tests

- [ ] **6.1** Smoke test script executed
  ```bash
  ./scripts/staging-smoke-tests.sh https://[domain]
  ```
- [ ] **6.2** All critical tests passed
- [ ] **6.3** Test results documented

### Manual Smoke Tests

#### Infrastructure (🔴 Critical)

- [ ] **6.4** Application URL accessible: `https://[domain]`
- [ ] **6.5** Health endpoint responds: `https://[domain]/api/health`
  - **Expected**: `{"status":"ok"}`
- [ ] **6.6** Response time < 2 seconds
- [ ] **6.7** HTTPS enforced (HTTP redirects to HTTPS)

#### Critical Pages (🔴 Critical)

- [ ] **6.8** Home page loads: `https://[domain]/`
- [ ] **6.9** Admin login loads: `https://[domain]/admin/login`
- [ ] **6.10** Business login loads: `https://[domain]/business/login`
- [ ] **6.11** Wallet page accessible: `https://[domain]/business/wallet`

#### API Endpoints (🔴 Critical)

- [ ] **6.12** Stripe Connect endpoint exists: `/api/business/stripe/connect`
- [ ] **6.13** Webhook endpoint rejects unsigned requests (400/401)
- [ ] **6.14** Payment Intent API endpoint exists

#### Static Assets (🟡 High)

- [ ] **6.15** Next.js static files serve correctly
- [ ] **6.16** Public assets accessible
- [ ] **6.17** Images load correctly

#### Security Headers (🟡 High)

- [ ] **6.18** HSTS header present
  ```bash
  curl -I https://[domain] | grep -i "strict-transport-security"
  ```
- [ ] **6.19** X-Frame-Options header present
- [ ] **6.20** X-Content-Type-Options header present

**Sign-off**: _________________________ Date: _________

---

## Section 7: Stripe Integration Verification 🔴

**Status**: [ ] Complete

### Stripe Dashboard

- [ ] **7.1** Platform Stripe account accessible
- [ ] **7.2** Connect settings configured
- [ ] **7.3** OAuth redirect URI correct
- [ ] **7.4** Webhook endpoint configured
- [ ] **7.5** Webhook secret matches environment variable
- [ ] **7.6** API keys match environment variables

### OAuth Flow Test

- [ ] **7.7** Navigate to wallet page as business user
- [ ] **7.8** Click "Connect Stripe Account"
- [ ] **7.9** Redirect to Stripe OAuth page successful
- [ ] **7.10** OAuth URL contains correct client_id
- [ ] **7.11** OAuth URL contains valid state token
- [ ] **7.12** Complete OAuth (select test account)
- [ ] **7.13** Redirect back to application successful
- [ ] **7.14** Success message displayed
- [ ] **7.15** Connected account ID displayed
- [ ] **7.16** Database updated:
  ```sql
  SELECT stripe_connect_enabled, stripe_connected_account_id
  FROM business_accounts WHERE id = '[test-id]';
  # Expected: stripe_connect_enabled = true, account_id populated
  ```

### Payment Flow Test

- [ ] **7.17** Initiate wallet recharge ($10 test amount)
- [ ] **7.18** Payment Element loads correctly
- [ ] **7.19** Enter test card: 4242 4242 4242 4242
- [ ] **7.20** Payment completes successfully
- [ ] **7.21** Success message displayed
- [ ] **7.22** Wallet balance updated
- [ ] **7.23** Payment visible in Stripe dashboard (connected account)
- [ ] **7.24** Transaction recorded in database

### Webhook Test

- [ ] **7.25** Webhook event received (check logs)
- [ ] **7.26** Webhook signature verified
- [ ] **7.27** Event processed successfully
- [ ] **7.28** Wallet balance updated via webhook

**Sign-off**: _________________________ Date: _________

---

## Section 8: Database Connectivity 🔴

**Status**: [ ] Complete

### Connection Test

- [ ] **8.1** Database accessible from application
- [ ] **8.2** Connection pool configured correctly
- [ ] **8.3** No connection errors in logs

### Query Test

- [ ] **8.4** Read query successful:
  ```sql
  SELECT COUNT(*) FROM business_accounts;
  ```
- [ ] **8.5** Write query successful:
  ```sql
  INSERT INTO wallet_transactions (...) VALUES (...);
  ```
- [ ] **8.6** Update query successful:
  ```sql
  UPDATE business_accounts SET wallet_balance = wallet_balance + 10.00 WHERE id = '...';
  ```
- [ ] **8.7** Delete query successful (test data only)

### Performance

- [ ] **8.8** Query response times acceptable (< 100ms for simple queries)
- [ ] **8.9** No slow query warnings
- [ ] **8.10** Connection count within limits

**Sign-off**: _________________________ Date: _________

---

## Section 9: Email Notifications 🟡

**Status**: [ ] Complete

### Email Service Configuration

- [ ] **9.1** Resend API key configured
- [ ] **9.2** From email address verified
- [ ] **9.3** Email service accessible

### Email Sending Test

- [ ] **9.4** Test email sent successfully
- [ ] **9.5** Email received in inbox (not spam)
- [ ] **9.6** Email formatting correct
- [ ] **9.7** Links in email work correctly

### Notification Emails

- [ ] **9.8** Payment success email works
- [ ] **9.9** OAuth connection email works
- [ ] **9.10** Auto-recharge email works (if triggered)

**Sign-off**: _________________________ Date: _________

---

## Section 10: Monitoring & Logging 🟡

**Status**: [ ] Complete

### Application Logs

- [ ] **10.1** Application logs accessible
  ```bash
  pm2 logs --lines 100
  # OR
  sudo journalctl -u vehicleservice-[environment] -n 100
  ```
- [ ] **10.2** Log level appropriate (info/warn/error)
- [ ] **10.3** No unexpected errors in logs
- [ ] **10.4** Structured logging working correctly

### System Logs

- [ ] **10.5** System logs accessible
- [ ] **10.6** No system-level errors
- [ ] **10.7** Resource usage normal (CPU, memory, disk)

### Log Rotation

- [ ] **10.8** Log rotation configured
- [ ] **10.9** Old logs compressed
- [ ] **10.10** Log retention policy set (14 days)

### Monitoring Setup

- [ ] **10.11** Uptime monitoring configured (UptimeRobot, etc.)
- [ ] **10.12** Error tracking configured (Sentry, etc.)
- [ ] **10.13** Performance monitoring enabled
- [ ] **10.14** Alert contacts configured

**Sign-off**: _________________________ Date: _________

---

## Section 11: Security Verification 🔴

**Status**: [ ] Complete

### Authentication

- [ ] **11.1** Authentication required for protected routes
- [ ] **11.2** Admin routes protected
- [ ] **11.3** Business routes protected
- [ ] **11.4** Unauthenticated access blocked

### Authorization

- [ ] **11.5** Role-based access control working
- [ ] **11.6** Business users cannot access other businesses' data
- [ ] **11.7** Regular users cannot access admin functions

### Data Protection

- [ ] **11.8** Stripe tokens encrypted in database
  ```sql
  SELECT stripe_access_token_encrypted FROM business_accounts LIMIT 1;
  # Expected: Starts with 'encrypted:', not plain 'sk_' or 'rk_'
  ```
- [ ] **11.9** Sensitive data not in logs
- [ ] **11.10** Sensitive data not in error messages

### Input Validation

- [ ] **11.11** SQL injection attempts blocked
- [ ] **11.12** XSS attempts sanitized
- [ ] **11.13** Invalid inputs rejected with proper errors

### HTTPS/SSL

- [ ] **11.14** HTTPS enforced
- [ ] **11.15** SSL certificate valid and not expired
- [ ] **11.16** TLS 1.2+ enforced
- [ ] **11.17** Weak ciphers disabled

### Security Headers

- [ ] **11.18** All security headers present (verified in Section 6)
- [ ] **11.19** CORS configured correctly
- [ ] **11.20** CSP header configured (if applicable)

**Sign-off**: _________________________ Date: _________

---

## Section 12: Performance Verification 🟢

**Status**: [ ] Complete

### Response Times

- [ ] **12.1** Home page load time < 2 seconds
- [ ] **12.2** API response time < 1 second
- [ ] **12.3** Database queries < 100ms
- [ ] **12.4** Static assets load quickly

### Resource Usage

- [ ] **12.5** CPU usage < 70% under normal load
- [ ] **12.6** Memory usage stable (no leaks)
- [ ] **12.7** Disk I/O acceptable
- [ ] **12.8** Network bandwidth sufficient

### Caching

- [ ] **12.9** Static assets cached correctly
- [ ] **12.10** Cache headers configured
- [ ] **12.11** CDN configured (if applicable)

**Sign-off**: _________________________ Date: _________

---

## Section 13: Rollback Readiness 🔴

**Status**: [ ] Complete

### Rollback Plan

- [ ] **13.1** Rollback procedure documented
- [ ] **13.2** Previous version tag identified
- [ ] **13.3** Database backup available
- [ ] **13.4** Rollback tested in lower environment

### Rollback Prerequisites

- [ ] **13.5** DevOps team aware of rollback plan
- [ ] **13.6** Rollback commands prepared
- [ ] **13.7** Rollback can be executed in < 10 minutes
- [ ] **13.8** Communication plan for rollback

**Sign-off**: _________________________ Date: _________

---

## Section 14: Documentation & Handoff 🟡

**Status**: [ ] Complete

### Documentation

- [ ] **14.1** Deployment notes documented
- [ ] **14.2** Known issues documented
- [ ] **14.3** Troubleshooting guide updated
- [ ] **14.4** Runbook updated

### Team Handoff

- [ ] **14.5** QA team notified of deployment completion
- [ ] **14.6** Support team briefed on new features
- [ ] **14.7** Product team informed
- [ ] **14.8** Stakeholders updated

### Post-Deployment Monitoring

- [ ] **14.9** Monitoring alerts configured
- [ ] **14.10** On-call schedule confirmed
- [ ] **14.11** Escalation path defined

**Sign-off**: _________________________ Date: _________

---

## Final Sign-Off

### Deployment Summary

**Environment**: [ ] Staging [ ] Production

**Deployment Date**: _______________ Time: _______________

**Version Deployed**: v1.0.0-[environment]

**Git Commit**: _______________________________________________

**Total Verification Items**: 165

**Items Completed**: _______ / 165 ( _____ %)

### Status Assessment

- [ ] **✅ APPROVED** - All critical items verified, deployment successful
- [ ] **⚠️ APPROVED WITH CAVEATS** - Minor issues documented, acceptable for environment
- [ ] **❌ REJECTED** - Critical issues found, rollback required

### Known Issues

| Issue ID | Severity | Description | Impact | Resolution Plan |
|----------|----------|-------------|--------|-----------------|
| | | | | |
| | | | | |
| | | | | |

### Risk Assessment

**Overall Risk Level**: [ ] Low [ ] Medium [ ] High

**Concerns**: _________________________________________________

_______________________________________________________________

_______________________________________________________________

### Recommendations

- [ ] Proceed to next phase (QA testing)
- [ ] Monitor closely for 24 hours
- [ ] Schedule follow-up review
- [ ] Address known issues
- [ ] Plan for production deployment

### Approvals

**Deployment Engineer**: _________________________ Date: _________

**QA Lead**: _________________________ Date: _________

**DevOps Lead**: _________________________ Date: _________

**Product Manager**: _________________________ Date: _________

---

## Quick Reference

### Critical Checks (Must Pass)

1. ✅ Application accessible and responding
2. ✅ Health endpoint returns 200
3. ✅ Database migrations successful
4. ✅ All environment variables set
5. ✅ Stripe OAuth flow works
6. ✅ Payment processing works
7. ✅ Webhooks processing correctly
8. ✅ Authentication/authorization working
9. ✅ Secrets encrypted in database
10. ✅ No critical errors in logs

### Emergency Contacts

**DevOps Lead**: ___________________________

**Backend Lead**: ___________________________

**QA Lead**: ___________________________

**On-Call Engineer**: ___________________________

### Rollback Command

```bash
# Quick rollback procedure
ssh user@[domain]
cd /var/www/vehicleservice
pm2 stop vehicleservice-[environment]
git checkout tags/v[previous-version]
npm ci && npm run build
pm2 restart vehicleservice-[environment]
```

---

**Document Version**: 1.0.0
**Last Updated**: November 7, 2025
**Related Documents**:
- `/docs/STAGING_DEPLOYMENT_GUIDE.md` - Deployment procedures
- `/scripts/staging-smoke-tests.sh` - Automated smoke tests
- `/docs/QA_STRIPE_CONNECT_CHECKLIST.md` - QA testing
- `/docs/BATCH_4_REGRESSION_TESTING_CHECKLIST.md` - Full regression tests
