# Vercel Custom Domain Setup Guide

This guide explains how to configure Vercel environment variables for automatic custom domain management.

## Overview

The custom domain automation system requires three Vercel environment variables:
- **VERCEL_TOKEN** - API token for authentication
- **VERCEL_PROJECT_ID** - Identifies your Vercel project
- **VERCEL_TEAM_ID** - (Optional) Only needed for team projects

## Step 1: Get Your Vercel API Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it descriptively (e.g., "Custom Domain Automation")
4. Set scope to "Full Account" or limit to your specific project
5. Click "Create Token"
6. **Copy the token immediately** - you won't be able to see it again

**Security Note:** Treat this token like a password. Never commit it to version control.

## Step 2: Get Your Vercel Project ID

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **General**
4. Scroll down to find "Project ID"
5. Copy the project ID (format: `prj_xxxxxxxxxxxxx`)

## Step 3: Get Your Vercel Team ID (Team Projects Only)

**Skip this step if you're using a personal account.**

For team projects:
1. Go to your team settings in [Vercel Dashboard](https://vercel.com/teams)
2. Select your team
3. Go to **Settings** → **General**
4. Find "Team ID" near the top
5. Copy the team ID (format: `team_xxxxxxxxxxxxx`)

## Step 4: Configure Environment Variables

### For Local Development (.env.local)

Add to your `.env.local` file:

```bash
# Vercel Configuration
VERCEL_TOKEN=your_actual_token_here
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxx  # Optional - omit for personal projects

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### For Production (Vercel Dashboard)

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:

   **Variable 1:**
   - Key: `VERCEL_TOKEN`
   - Value: `your_actual_token_here`
   - Environment: ✅ Production (and Preview if needed)

   **Variable 2:**
   - Key: `VERCEL_PROJECT_ID`
   - Value: `prj_xxxxxxxxxxxxx`
   - Environment: ✅ Production (and Preview if needed)

   **Variable 3 (Team projects only):**
   - Key: `VERCEL_TEAM_ID`
   - Value: `team_xxxxxxxxxxxxx`
   - Environment: ✅ Production (and Preview if needed)

   **Variable 4:**
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://yourdomain.com` (your main platform domain)
   - Environment: ✅ Production

4. Click "Save" for each variable
5. **Redeploy your application** for changes to take effect

## Step 5: Verify Configuration

After deploying with the new environment variables:

1. Check the deployment logs for Vercel API messages
2. Try verifying a custom domain in your business portal
3. Logs should show: `"Adding domain example.com to Vercel..."`
4. Successful addition logs: `"Domain example.com successfully added to Vercel"`

## Step 6: Sync Existing Verified Domains

If you have domains that were verified **before** implementing this integration:

```bash
# Run the sync script locally
npx tsx scripts/sync-verified-domains-to-vercel.ts
```

This script will:
- Fetch all verified domains from your database
- Check if they exist in Vercel
- Add missing domains to Vercel
- Skip domains already in Vercel
- Provide a detailed summary

**Note:** Make sure your local `.env.local` has the Vercel credentials before running.

## Troubleshooting

### Error: "VERCEL_TOKEN environment variable is not set"

**Solution:**
- Add `VERCEL_TOKEN` to your environment variables
- For local dev: Add to `.env.local`
- For production: Add in Vercel Dashboard → Settings → Environment Variables
- Redeploy after adding

### Error: "Failed to add domain to Vercel: Domain already in use"

**This is not an error!** The domain is already configured in Vercel (possibly manually). The system will continue normally.

### Error: "Failed to add domain to Vercel: Forbidden"

**Causes:**
- Invalid or expired API token
- Token doesn't have permissions for this project
- Wrong team ID for team projects

**Solutions:**
- Generate a new token with proper scopes
- Verify VERCEL_PROJECT_ID is correct
- Add VERCEL_TEAM_ID if it's a team project

### Domain verified in DB but still 404 on Vercel

**Causes:**
- Environment variables not configured in production
- Domain not added to Vercel (pre-integration verification)
- DNS propagation delay (CNAME records)

**Solutions:**
1. Check Vercel environment variables are set in production
2. Redeploy the application
3. Run sync script: `npx tsx scripts/sync-verified-domains-to-vercel.ts`
4. Wait 24-48 hours for DNS propagation
5. Check Vercel Dashboard → Domains to see if domain is listed

### How to manually verify domain is in Vercel

1. Go to Vercel Dashboard
2. Click your project
3. Go to **Settings** → **Domains**
4. Your custom domains should be listed here
5. Status should show as "Valid Configuration" or verification instructions

## Security Best Practices

1. **Never commit tokens** to version control
2. **Rotate tokens periodically** (every 6-12 months)
3. **Use minimum required scopes** when creating tokens
4. **Monitor Vercel audit logs** for unauthorized API usage
5. **Delete unused tokens** from Vercel dashboard

## API Rate Limits

Vercel API has rate limits:
- **Free tier:** ~100 requests/hour
- **Pro tier:** Higher limits

**If you hit rate limits:**
- The sync script includes 500ms delays between requests
- Avoid running sync script multiple times in quick succession
- For bulk operations, contact Vercel support to increase limits

## What Happens Automatically

### When a business verifies their domain:
1. ✅ DNS records are checked (CNAME + TXT)
2. ✅ Database is updated (`custom_domain_verified = true`)
3. ✅ Domain is added to Vercel via API
4. ✅ User sees success message

### When a business removes their domain:
1. ✅ Domain is removed from Vercel via API
2. ✅ Database is updated (domain cleared)
3. ✅ User sees confirmation message

### No manual Vercel configuration needed!

---

## Support

If you encounter issues not covered here:
1. Check Vercel deployment logs
2. Check application logs (server-side)
3. Verify all environment variables are set
4. Ensure DNS records are correct
5. Wait for DNS propagation (24-48 hours for CNAME)

For Vercel API documentation: https://vercel.com/docs/rest-api
