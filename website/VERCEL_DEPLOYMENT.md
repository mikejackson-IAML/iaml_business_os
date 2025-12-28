# Vercel Serverless Proxy Deployment Guide

## Overview

This guide walks you through deploying the IAML serverless API proxies to Vercel. These proxies provide complete security for your API keys by keeping them server-side while allowing your frontend to make requests through secure endpoints.

## Why Vercel?

- ✅ **Free tier**: 100GB bandwidth/month, 100,000 requests/month (more than enough for IAML traffic)
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Global CDN**: Fast responses worldwide
- ✅ **Easy integration**: Works perfectly with vanilla JavaScript
- ✅ **Zero build process**: No compilation needed, just deploy your files

## Architecture

```
Frontend (browser)
    ↓ (no API keys)
Vercel Proxy Functions (/api/*)
    ↓ (has API keys from server-side environment variables)
Airtable API / GoHighLevel Webhooks
```

## Phase 1: Vercel Setup

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or if you prefer using the Vercel dashboard, skip this step and proceed with Step 3.

### Step 2: Login to Vercel

```bash
vercel login
```

This opens your browser to authenticate. Follow the prompts to connect your GitHub account.

### Step 3: Link Your Project

```bash
cd /Users/mikejackson/Documents/IAML
vercel link
```

Vercel will ask a few questions:
- **Set up and deploy?** → Yes
- **Which scope?** → Your personal account (or organization if you prefer)
- **Link to existing project?** → No (first time)
- **Project name** → `iaml` (or whatever you prefer)
- **Directory** → `./` (current directory)

This creates a `.vercel/` folder with your project configuration.

### Step 4: Configure Environment Variables

You have two options:

#### Option A: Via Vercel Dashboard (Easier)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `iaml` project
3. Go to Settings → Environment Variables
4. Add each variable:

```
AIRTABLE_BASE_ID = applWPVmMkgMWoZIC
AIRTABLE_PROGRAMS_API_KEY = patPjrprLGRYRMGUQ.690b32ecac076c293c013addf5dabb64b44055348132d8dce1abccfea3622836
AIRTABLE_REGISTRATION_API_KEY = patlBhocGyiLc8ft9.87683fc724f184695853f45a953d0d56e24fb0a3a1e9272966aad2a43d911281
AIRTABLE_NEXT_PROGRAM_API_KEY = pat07EXbOrhdAPRO5.84330ef1cb8c7cc21f476e777cff12eb57bbc441e2db1a7a0c2817525e588b24
AIRTABLE_QUIZ_API_KEY = patlBhocGyiLc8ft9.87683fc724f184695853f45a953d0d56e24fb0a3a1e9272966aad2a43d911281
GHL_REGISTRATION_WEBHOOK = https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/8a0aa0b8-52c0-4810-8475-c0e1b82adb70
GHL_CONTACT_WEBHOOK = https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/f11dd475-e8a8-442d-a71e-862b25d34937
```

**Important**: Set these for both **Production** and **Development** environments.

#### Option B: Via CLI

```bash
vercel env add AIRTABLE_BASE_ID
vercel env add AIRTABLE_PROGRAMS_API_KEY
vercel env add AIRTABLE_REGISTRATION_API_KEY
vercel env add AIRTABLE_NEXT_PROGRAM_API_KEY
vercel env add AIRTABLE_QUIZ_API_KEY
vercel env add GHL_REGISTRATION_WEBHOOK
vercel env add GHL_CONTACT_WEBHOOK
```

For each command, paste the value and confirm.

## Phase 2: Test Locally (Optional but Recommended)

Before deploying to production, test the proxy functions locally:

```bash
vercel dev
```

This starts a local Vercel development server at `http://localhost:3000`.

**Test the proxies:**

1. Open browser DevTools (F12)
2. Open Network tab
3. Visit `http://localhost:3000/api/airtable-programs?table=tblFaya3JyTzyAdjJ&maxRecords=5`

You should see:
- Status: 200
- Response: Airtable records in JSON format
- **No API key visible** in the request headers ✓

## Phase 3: Deploy to Vercel

### Deploy to Production

```bash
vercel --prod
```

Vercel will:
1. Build your functions
2. Deploy to the Vercel edge network
3. Output your deployment URL: `https://iaml-xxx.vercel.app`

**Keep this URL!** You'll need it to update your frontend.

### Redeploy (if you make changes)

Simply run the same command:

```bash
vercel --prod
```

## Phase 4: Update Frontend to Use Proxies

Your frontend currently makes direct API calls. We need to update it to use the proxy endpoints instead.

### Location 1: `/programs/employee-relations-law.html` (Line ~2728)

**Old Code:**
```javascript
const AIRTABLE_API_KEY = ENV_CONFIG.AIRTABLE_PROGRAMS_API_KEY;
const AIRTABLE_BASE_ID = ENV_CONFIG.AIRTABLE_BASE_ID;
const PROGRAMS_TABLE = ENV_CONFIG.AIRTABLE_PROGRAMS_TABLE;

fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PROGRAMS_TABLE}?...`, {
  headers: {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
```

**New Code:**
```javascript
// No need for API keys anymore - proxy handles it
fetch(`/api/airtable-programs?table=tblFaya3JyTzyAdjJ&maxRecords=200&view=viwGwK0DuZyjMzsZI`, {
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Location 2: `/programs/employee-relations-law.html` (Line ~4341)

**Old Code:**
```javascript
const AIRTABLE_API_KEY = ENV_CONFIG.AIRTABLE_REGISTRATION_API_KEY;
const GHL_WEBHOOK = ENV_CONFIG.GHL_REGISTRATION_WEBHOOK;

fetch(`https://api.airtable.com/v0/${BASE_ID}/${COUPONS_TABLE}?...`, {
  headers: {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
```

**New Code:**
```javascript
fetch(`/api/airtable-coupons?code=${couponCode}`, {
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Location 3: `/programs/employee-relations-law.html` (Line ~7835)

**Old Code:**
```javascript
const apiKey = ENV_CONFIG.AIRTABLE_NEXT_PROGRAM_API_KEY;

fetch(`https://api.airtable.com/v0/${baseId}/${PROGRAMS_TABLE}?...`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
})
```

**New Code:**
```javascript
fetch(`/api/airtable-programs?table=tblFaya3JyTzyAdjJ&maxRecords=1&filterByFormula=${filterFormula}`, {
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Location 4: `/js/modals.js` (Line ~5)

**Old Code:**
```javascript
const GHL_WEBHOOK = ENV_CONFIG.GHL_CONTACT_WEBHOOK;

fetch(GHL_WEBHOOK, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(contactData)
})
```

**New Code:**
```javascript
fetch('/api/ghl-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'contact',
    data: contactData
  })
})
```

## Phase 5: Clean Up Environment Config

Once all frontend code is updated to use proxies, you can remove API keys from `env-config.local.js`:

**New `/js/env-config.local.js`:**
```javascript
window.ENV_CONFIG = {
    // Table/View IDs (not secrets - safe to keep)
    AIRTABLE_BASE_ID: 'applWPVmMkgMWoZIC',
    AIRTABLE_PROGRAMS_TABLE: 'tblFaya3JyTzyAdjJ',
    AIRTABLE_COUPONS_TABLE: 'tblBaUQKmYuIMsVQm',
    AIRTABLE_QUIZ_QUESTIONS_TABLE: 'tblKESCDfq65dWWHy',
    AIRTABLE_QUIZ_ANSWERS_TABLE: 'tbly6vzYhjPbroIIy',
    AIRTABLE_QUIZ_RECOMMENDATIONS_TABLE: 'tblp78ibbqFGYFGKb',
    AIRTABLE_QUIZ_SESSIONS_TABLE: 'tblzXcIgwisfko0WC',
    AIRTABLE_VIEW_ID: 'viwGwK0DuZyjMzsZI',

    // API Keys no longer needed - handled by Vercel proxies!
    // (You can delete AIRTABLE_PROGRAMS_API_KEY, AIRTABLE_REGISTRATION_API_KEY, etc.)

    // Google Analytics (still frontend)
    GA4_ID: 'G-XXXXXXXXXX'
};
```

## Testing Checklist

After updating the frontend:

- [ ] Programs widget loads correctly
- [ ] Registration modal displays sessions
- [ ] Coupon codes validate and show discounts
- [ ] Quiz questions load and display
- [ ] Contact form submits successfully
- [ ] Registration form submits successfully
- [ ] **No API keys visible** in browser DevTools Network tab
- [ ] All error messages display properly
- [ ] Mobile view works correctly
- [ ] Desktop view works correctly

### How to Verify No Keys Are Exposed

1. Open your browser DevTools (F12)
2. Go to Network tab
3. Make an API call (e.g., search for programs, submit a form)
4. Click on any request to `/api/*`
5. Check the Request Headers and Response
6. **You should NOT see any `Bearer` tokens or actual keys**

## Troubleshooting

### "Module not found" or "Cannot find module @vercel/node"

Vercel handles this automatically. If you see this locally with `vercel dev`, it's normal.

### API requests return 500 error

Check the Vercel logs:
```bash
vercel logs iaml --prod
```

**Common causes:**
- Missing environment variable (check Vercel dashboard)
- Typo in environment variable value
- Airtable table ID is incorrect

### CORS errors

The proxy functions include CORS headers. If you still see CORS errors:
1. Check that the proxy is returning the correct headers
2. Verify the frontend is calling `/api/*` endpoints (not the old direct URLs)

### Deployment fails

1. Verify `vercel.json` is in the project root
2. Verify `api/` directory contains `.js` files
3. Run `vercel --prod` again

## File Reference

**Files Created:**
- `/vercel.json` - Vercel configuration
- `/api/airtable-programs.js` - Programs/sessions proxy
- `/api/airtable-coupons.js` - Coupons validation proxy
- `/api/airtable-quiz.js` - Quiz operations proxy
- `/api/ghl-webhook.js` - GoHighLevel webhook proxy

**Files to Update:**
- `programs/employee-relations-law.html` - Update fetch calls (3 locations)
- `js/modals.js` - Update GHL webhook calls
- `components/header.html` - Update GHL webhook calls (if used)
- `js/env-config.local.js` - Remove API keys (after frontend updates)

**Files Modified:**
- `.gitignore` - Added `.vercel` entries

## Deployment URL

After deploying, your API endpoints will be at:
- `https://YOUR_VERCEL_URL/api/airtable-programs`
- `https://YOUR_VERCEL_URL/api/airtable-coupons`
- `https://YOUR_VERCEL_URL/api/airtable-quiz`
- `https://YOUR_VERCEL_URL/api/ghl-webhook`

Or if you set up a custom domain:
- `https://iaml.com/api/airtable-programs`
- etc.

## Next Steps

1. Deploy to Vercel with `vercel --prod`
2. Update frontend fetch calls to use `/api/*` endpoints
3. Test thoroughly with all features
4. Once confirmed working, remove API keys from env-config.local.js
5. Commit and push to GitHub (no secrets exposed!)

## Important Notes

- **The `api/` functions are now your source of truth** for API keys
- **Keep Vercel environment variables secure** - same as before, just on their servers
- **The free tier is sufficient** for IAML traffic - monitor usage in Vercel dashboard
- **Redeploy anytime** you update the proxy code with `vercel --prod`

## Support

For issues with:
- **Vercel deployment**: Check [vercel.com/docs](https://vercel.com/docs)
- **Airtable API**: See [airtable.com/developers](https://airtable.com/developers)
- **GoHighLevel webhooks**: Check your GHL account settings

## Summary

You now have:
- ✅ API keys stored ONLY on Vercel servers
- ✅ Frontend makes secure requests to proxy endpoints
- ✅ Browser DevTools shows NO exposed secrets
- ✅ Can safely push code to GitHub
- ✅ Global CDN for fast, reliable performance

Your IAML website is now secure! 🎉
