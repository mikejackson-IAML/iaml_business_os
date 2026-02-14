# MCP Health Check

Check MCP server connections and troubleshoot any failures.

## Quick Status Check

Run this to see all MCP server connections:

```bash
claude mcp list
```

## Understanding the Output

| Status | Meaning |
|--------|---------|
| ✓ Connected | Working - no action needed |
| ✗ Failed to connect | Missing credentials or server issue |

## Troubleshooting Failed Servers

### If a server shows "Failed to connect"

1. **Check if credentials are configured:**
   ```bash
   claude mcp get <server-name>
   ```

2. **Re-add with credentials** (if missing):
   ```bash
   claude mcp add <server-name> -e API_KEY=your-key -- npx -y <package-name>
   ```

3. **Restart Claude Code** for changes to take effect

### Common Fixes by Server

| Server | Fix Command |
|--------|-------------|
| sentry | `claude mcp add sentry -e SENTRY_AUTH_TOKEN=xxx -e SENTRY_ORG=iaml -- npx -y @sentry/mcp-server` |
| brave-search | `claude mcp add brave-search -e BRAVE_API_KEY=xxx -- npx -y @brave/brave-search-mcp-server` |
| stripe | `claude mcp add stripe -e STRIPE_API_KEY=xxx -- npx -y @stripe/mcp --tools=all` |

## When You Need LastPass

You only need to retrieve credentials from LastPass when:

- **Adding a NEW MCP server** for the first time
- **Setting up on a new machine**
- **A credential has been rotated/expired**

Credentials are stored inside Claude Code's config after `claude mcp add -e`. You do NOT need to export them each session.

## Credential Locations in LastPass

| Credential | LastPass Note |
|------------|---------------|
| Most API keys | "MCP Credentials" |
| Google service account | "Google Search Console Service Account" |

## Adding a New MCP Server

1. Get the API key from LastPass (or the service's dashboard)
2. Run the add command with `-e` flag:
   ```bash
   claude mcp add <name> -e API_KEY=value -- <command>
   ```
3. Restart Claude Code
4. Verify with `claude mcp list`

## Currently Configured Servers

These servers are already set up with credentials embedded:

**Core (always needed):**
- n8n-brain - Workflow learning layer
- n8n - Workflow management
- context7 - Documentation lookup
- playwright - Web automation

**Data & Search:**
- apify - Web scraping
- exa - AI search
- firecrawl - Web crawling
- dataforseo - SEO data

**Communication:**
- ghl - GoHighLevel CRM
- heyreach - LinkedIn automation
- elevenlabs - Voice AI
- vapi - Voice agents

**Infrastructure:**
- cloudinary - Image optimization
- neverbounce - Email verification

## Server Not Listed?

If you need an MCP server that's not configured, check the [MCP Server Registry](https://github.com/modelcontextprotocol/servers) for available servers and their setup instructions.
