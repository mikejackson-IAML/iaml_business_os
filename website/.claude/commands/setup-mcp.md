# Setup MCP Credentials

Walk the user through setting up MCP server credentials from LastPass for this cloud session.

## Overview

This command helps you configure environment variables for MCP servers at the start of each Claude Code cloud session. Credentials are stored in LastPass and need to be exported to the shell environment.

---

## Step-by-Step Setup

### Step 1: Retrieve MCP Credentials from LastPass

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

### Step 2: Copy and Run the Exports

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

**Servers that don't need credentials:**
- playwright (no auth needed)
- context7 (no auth needed)
- n8n-docs (no auth needed)
- lighthouse (no auth needed)

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
  GOOGLE_SERVICE_ACCOUNT_KEY; do \
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
