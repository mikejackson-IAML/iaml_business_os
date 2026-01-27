# Setup MCP Credentials

Walk the user through setting up MCP servers and credentials for Claude Code.

## Overview

This command helps you configure MCP servers at the start of each Claude Code session. It:
1. Adds MCP servers to Claude Code (if not already added)
2. Sets up environment variables for authentication

---

## Step 1: Add Core MCP Servers

Run these commands to add the essential MCP servers (only needed once per machine):

### n8n-brain (REQUIRED - Learning Layer for n8n Workflows)
```bash
claude mcp add n8n-brain -e SUPABASE_URL=https://mnkuffgxemfyitcjnjdc.supabase.co -e SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua3VmZmd4ZW1meWl0Y2puamRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNjc1NSwiZXhwIjoyMDc5NDAyNzU1fQ.9xE-Ee_A1UgVO12avVwtzLaT792EZ8JCJaupAAP0-88 -- node "/Users/mike/IAML Business OS/mcp-servers/n8n-brain/index.js"
```

### Context7 (Documentation lookup)
```bash
claude mcp add context7 -- npx -y @anthropic/mcp-context7
```

### Playwright (Web automation)
```bash
claude mcp add playwright -- npx -y @anthropic/mcp-playwright
```

**Verify servers are added:**
```bash
claude mcp list
```

---

## Step 2: Retrieve MCP Credentials from LastPass

Open LastPass and find the note called **"MCP Credentials"**. This contains bash export statements for all API keys.

The content looks like:
```bash
# IAML MCP Server Credentials
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export N8N_API_URL="https://..."
export N8N_API_KEY="..."
# ... etc
```

## Step 3: Copy and Run the Exports

Copy the entire contents of the "MCP Credentials" LastPass note and paste it into your terminal. This sets all environment variables for the current session.

**Required variables for all 26 MCP servers:**

| Server | Required Environment Variables |
|--------|-------------------------------|
| supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| n8n | `N8N_API_URL`, `N8N_API_KEY` |
| apify | `APIFY_TOKEN` |
| exa | `EXA_API_KEY` |
| airtable | `AIRTABLE_API_KEY` |
| gohighlevel | `GHL_API_KEY`, `GHL_LOCATION_ID` |
| smartlead | `SMARTLEAD_API_KEY` |
| zapmail | `ZAPMAIL_API_KEY` |
| apollo | `APOLLO_API_KEY` |
| semgrep | `SEMGREP_APP_TOKEN` |
| dataforseo | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` |
| vercel | `VERCEL_TOKEN`, `VERCEL_TEAM_ID` |
| notion | `NOTION_API_KEY` |
| perplexity | `PERPLEXITY_API_KEY` |
| gemini | `GEMINI_API_KEY` |
| brave-search | `BRAVE_API_KEY` |
| firecrawl | `FIRECRAWL_API_KEY` |
| stripe | `STRIPE_SECRET_KEY` |
| elevenlabs | `ELEVENLABS_API_KEY` |
| vapi | `VAPI_API_KEY` |
| google-search-console | `GOOGLE_SERVICE_ACCOUNT_KEY` |
| google-workspace | `GOOGLE_SERVICE_ACCOUNT_KEY` |
| **pagespeed-insights** | `PAGESPEED_API_KEY` |
| **cloudinary** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **sentry** | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` |

**Servers that don't need credentials:**
- playwright (no auth needed)
- context7 (no auth needed)
- n8n-docs (no auth needed)
- lighthouse (no auth needed)

---

## Speed Optimizer Employee - New MCP Servers

The `/speed-optimize` command uses these additional MCP servers for performance analysis:

### PageSpeed Insights API
Get your API key from Google Cloud Console:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new API key or use existing
3. Enable the "PageSpeed Insights API"

```bash
export PAGESPEED_API_KEY="your-api-key"
```

### Cloudinary (Optional - for image optimization)
Get credentials from Cloudinary Console:
1. Go to https://console.cloudinary.com/settings/api-keys
2. Copy your Cloud Name, API Key, and API Secret

```bash
export CLOUDINARY_CLOUD_NAME="your-cloud-name"
export CLOUDINARY_API_KEY="your-api-key"
export CLOUDINARY_API_SECRET="your-api-secret"
```

### Sentry (Optional - for error tracking)
Get auth token from Sentry:
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Create a new auth token with `project:read` scope

```bash
export SENTRY_AUTH_TOKEN="your-auth-token"
export SENTRY_ORG="your-org-slug"
```

### Step 3: Setup Google Service Account Key

For Google Search Console and Google Workspace, you need the service account JSON key:

1. Open LastPass and find **"Google Search Console Service Account"**
2. Copy the JSON content
3. Create the key file:

```bash
cat > ~/.config/gcloud/mcp-service-account.json << 'EOF'
# Paste your JSON key here
EOF
```

4. Set the environment variable:
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY="$HOME/.config/gcloud/mcp-service-account.json"
```

### Step 4: Verify Setup

Run this command to verify all required variables are set:

```bash
echo "=== MCP Credentials Check ===" && \
for var in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY N8N_API_URL N8N_API_KEY \
  APIFY_TOKEN EXA_API_KEY AIRTABLE_API_KEY GHL_API_KEY GHL_LOCATION_ID \
  SMARTLEAD_API_KEY ZAPMAIL_API_KEY APOLLO_API_KEY SEMGREP_APP_TOKEN \
  DATAFORSEO_LOGIN DATAFORSEO_PASSWORD VERCEL_TOKEN VERCEL_TEAM_ID \
  NOTION_API_KEY PERPLEXITY_API_KEY GEMINI_API_KEY BRAVE_API_KEY \
  FIRECRAWL_API_KEY STRIPE_SECRET_KEY ELEVENLABS_API_KEY VAPI_API_KEY \
  GOOGLE_SERVICE_ACCOUNT_KEY PAGESPEED_API_KEY CLOUDINARY_CLOUD_NAME \
  CLOUDINARY_API_KEY CLOUDINARY_API_SECRET SENTRY_AUTH_TOKEN SENTRY_ORG; do \
  if [ -n "${!var}" ]; then \
    echo "✓ $var is set"; \
  else \
    echo "✗ $var is NOT set"; \
  fi; \
done
```

---

## Quick Setup Template

If you need to create the LastPass note from scratch, here's the template:

```bash
# IAML MCP Server Credentials
# Copy this entire block and paste into terminal at start of each cloud session

# Supabase
export SUPABASE_URL=""
export SUPABASE_SERVICE_ROLE_KEY=""

# n8n
export N8N_API_URL=""
export N8N_API_KEY=""

# Apify
export APIFY_TOKEN=""

# Exa Search
export EXA_API_KEY=""

# Airtable
export AIRTABLE_API_KEY=""

# GoHighLevel
export GHL_API_KEY=""
export GHL_LOCATION_ID=""

# SmartLead
export SMARTLEAD_API_KEY=""

# ZapMail
export ZAPMAIL_API_KEY=""

# Apollo
export APOLLO_API_KEY=""

# Semgrep
export SEMGREP_APP_TOKEN=""

# DataForSEO
export DATAFORSEO_LOGIN=""
export DATAFORSEO_PASSWORD=""

# Vercel
export VERCEL_TOKEN=""
export VERCEL_TEAM_ID=""

# Notion
export NOTION_API_KEY=""

# Perplexity
export PERPLEXITY_API_KEY=""

# Gemini
export GEMINI_API_KEY=""

# Brave Search
export BRAVE_API_KEY=""

# Firecrawl
export FIRECRAWL_API_KEY=""

# Stripe
export STRIPE_SECRET_KEY=""

# ElevenLabs
export ELEVENLABS_API_KEY=""

# Vapi
export VAPI_API_KEY=""

# PageSpeed Insights (Speed Optimizer)
export PAGESPEED_API_KEY="AIzaSyCY5Q46dQcUeXdp251niJGZFXsBxHgLZ34"

# Cloudinary (Speed Optimizer - Image Optimization)
export CLOUDINARY_CLOUD_NAME="detrhojvo"
export CLOUDINARY_API_KEY="647898349169165"
export CLOUDINARY_API_SECRET="EF-5IpOWns0jJleXNc7vvirGsBM"

# Sentry (Speed Optimizer - Error Tracking)
export SENTRY_AUTH_TOKEN="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"
export SENTRY_ORG="iaml"

# Google (path to service account JSON)
export GOOGLE_SERVICE_ACCOUNT_KEY="$HOME/.config/gcloud/mcp-service-account.json"
```

---

## Troubleshooting

### MCP server fails to start
1. Check that the environment variable is correctly set: `echo $VARIABLE_NAME`
2. Verify the API key is valid (no extra whitespace or quotes)
3. Check the MCP server logs for specific error messages

### Google services not working
1. Ensure the service account JSON file exists at the specified path
2. Verify the service account has the correct permissions in Google Cloud Console
3. Check that the domain is verified in Google Search Console

### Credentials expire
Some API keys may need periodic rotation. If a server stops working:
1. Generate a new API key from the service's dashboard
2. Update the LastPass note
3. Re-run the export commands

---

## Session Persistence

**Important**: Environment variables are lost when the cloud session ends. You must run `/setup-mcp` at the start of each new cloud session to restore credentials.

For local development, consider adding the exports to `~/.bashrc` or `~/.zshrc` (but never commit credentials to git).
