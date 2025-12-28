# Local Development Guide

## Overview

This IAML website uses **Vercel serverless functions** for the registration and quiz features. You must use `vercel dev` to run the site locally.

## Quick Start

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Run Vercel Dev

From the project root directory:

```bash
vercel dev
```

You should see output like:
```
Ready! Available at http://localhost:3000
```

### 3. Open in Browser

Navigate to: `http://localhost:3000`

The registration page will be at: `http://localhost:3000/register.html`

## Why Use Vercel Dev?

The registration and quiz pages require API endpoints located in the `/api/` directory:

- `/api/airtable-quiz` - Fetches program sessions and coupon data
- `/api/create-payment-intent` - Creates Stripe payment intents
- `/api/ghl-webhook` - Submits registrations to GoHighLevel

These are **serverless functions** that only work with:
1. **Vercel Dev** (`vercel dev`) - for local testing
2. **Vercel Production** - when deployed to Vercel

Simple HTTP servers (like `python -m http.server`) won't work because they can't execute serverless functions.

## Environment Variables

Environment variables are automatically loaded from `.env.local` by Vercel CLI:

- `AIRTABLE_BASE_ID` - Your Airtable base ID
- `AIRTABLE_QUIZ_API_KEY` - API key for quiz/session operations
- `AIRTABLE_REGISTRATION_API_KEY` - API key for registration operations
- `AIRTABLE_PROGRAMS_API_KEY` - API key for program data
- `AIRTABLE_NEXT_PROGRAM_API_KEY` - API key for next program calendar
- `GHL_REGISTRATION_WEBHOOK` - GoHighLevel webhook URL
- `GHL_CONTACT_WEBHOOK` - GoHighLevel contact webhook URL

Never commit `.env.local` to git (it's in `.gitignore`).

## Common Issues

### "Unable to load sessions. For local testing, run: vercel dev"

This error appears when trying to access the registration page without running `vercel dev`.

**Solution:** Run `vercel dev` from the project root.

### Port 3000 Already in Use

If port 3000 is occupied, you can specify a different port:

```bash
vercel dev --listen 3001
```

Then access the site at `http://localhost:3001`

### API Endpoints Not Working

Make sure:
1. You're running `vercel dev` (not just opening the HTML file)
2. The Vercel CLI is up to date: `npm install -g vercel@latest`
3. You're using the correct URL (http://localhost:3000, not file://)

### Changes Not Reflecting

Vercel Dev watches for file changes. If a change isn't reflected:

1. Stop `vercel dev` (Ctrl+C)
2. Run `vercel dev` again

## File Organization

```
/
├── register.html           # Registration page
├── quiz.html              # Quiz page
├── css/                   # Stylesheets
├── js/                    # Client-side JavaScript
│   ├── register.js        # Registration logic
│   ├── env-config.js      # Environment config template
│   └── env-config.local.js # Local secrets (not committed)
├── api/                   # Serverless functions
│   ├── airtable-quiz.js   # Airtable API proxy
│   ├── create-payment-intent.js  # Stripe integration
│   └── ghl-webhook.js     # GoHighLevel integration
├── .env.local            # Environment variables (not committed)
├── vercel.json           # Vercel configuration
└── README-DEV.md         # This file
```

## Deployment

When you're ready to deploy to production:

```bash
vercel
```

This will push your code to Vercel and automatically set up environment variables from your local `.env.local`.

## Further Reading

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
