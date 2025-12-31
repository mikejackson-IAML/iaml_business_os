# MCP Server Debugging Guide

Use these tiered configurations to identify which MCP server is causing the JSON schema error.

## The Problem

Error: `tools.117.custom.input_schema: JSON schema is invalid. It must match JSON Schema draft 2020-12`

One of your MCP servers is providing a tool with an invalid JSON schema.

## Testing Process

### Step 1: Start with Tier 1 (Currently Active)
The `.mcp.json` in the project root is set to Tier 1 (5 official servers).

**Restart Claude Code** and test if the error occurs.

- If NO error: Proceed to Tier 2
- If ERROR: One of the official servers has an issue (unlikely - report to Anthropic)

### Step 2: Test Each Tier
Copy each tier file to `.mcp.json` and restart:

```bash
# Test Tier 2 (adds infra: supabase, vercel, vapi, elevenlabs)
cp .mcp-tiers/tier2-add-infra.json .mcp.json

# Test Tier 3 (adds search/data: exa, airtable, firecrawl, context7)
cp .mcp-tiers/tier3-add-search-data.json .mcp.json

# Test Tier 4 (adds automation: n8n, n8n-docs, gohighlevel)
cp .mcp-tiers/tier4-add-automation.json .mcp.json

# Test Tier 5 (adds remaining: apify, semgrep, lighthouse, google-*, gemini)
cp .mcp-tiers/tier5-add-remaining.json .mcp.json

# Test Tier 6 (suspect community: smartlead, zapmail, apollo, dataforseo)
cp .mcp-tiers/tier6-suspect-community.json .mcp.json
```

### Step 3: Identify the Culprit
When the error appears, the problematic server is in that tier but not the previous one.

Then test servers from that tier individually to pinpoint the exact one.

## Tier Contents

| Tier | Servers | Risk Level |
|------|---------|------------|
| 1 | playwright, stripe, notion, brave-search, perplexity | Low (Official) |
| 2 | + supabase, vercel, vapi, elevenlabs | Low |
| 3 | + exa, airtable, firecrawl, context7 | Medium |
| 4 | + n8n, n8n-docs, gohighlevel | Medium |
| 5 | + apify, semgrep, lighthouse, google-search-console, google-workspace, gemini | Medium-High |
| 6 | smartlead, zapmail, apollo, dataforseo | High (Community) |

## Most Likely Culprits

Based on typical issues, these community packages are most likely to have schema problems:
- `smartlead-mcp-by-leadmagic`
- `zapmail-mcp`
- `dataforseo-mcp-server`
- `@thevgergroup/apollo-io-mcp`

## After Identifying the Problem

Once you find the problematic server:
1. Check if there's an updated version
2. Open an issue on the MCP server's GitHub repo
3. Remove it from your config until fixed
4. Or create a wrapper that fixes the schema

## Quick Commands

```bash
# View current config
cat .mcp.json

# Restore full config (after testing)
cp .mcp.json.backup .mcp.json

# Restore to working tier
cp .mcp-tiers/tier3-add-search-data.json .mcp.json
```
